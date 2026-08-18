import os
import shutil
import uuid
import datetime
import logging
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, BackgroundTasks, Depends
from app.models.schemas import (
    ChatRequest, ChatResponse, HostTwinCreateRequest, HostTwinChatRequest,
    VectorDbSettingsRequest, VectorDbStatsResponse, PodcastSchema, EpisodeSchema,
    SourceMetadata, UserRegister, UserLogin, UserResponse
)
from app.utils.auth import hash_password, verify_password, create_access_token, decode_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database.mongodb import db_instance
from app.database.faiss_store import vector_store
from app.ai.whisper import whisper_service
from app.ai.twin_agent import host_twin_agent
from app.ai.openai_client import openai_wrapper
from app.services.audio_service import audio_service
from app.services.rag_service import rag_service
from app.services.analytics_service import analytics_service
from app.services.knowledge_service import knowledge_service
from app.utils.config import settings

logger = logging.getLogger("app.api")
router = APIRouter()

# Helper to generate standard upload date
def get_current_date() -> str:
    return datetime.date.today().isoformat()

@router.get("/podcasts", response_model=List[dict])
async def get_podcasts():
    """Retrieves all podcasts from database."""
    cursor = db_instance.db["podcasts"].find()
    podcasts = await cursor.to_list(length=100)
    return podcasts

@router.get("/episodes", response_model=List[dict])
async def get_episodes():
    """Retrieves all episodes from database."""
    cursor = db_instance.db["episodes"].find()
    episodes = await cursor.to_list(length=100)
    return episodes

@router.delete("/podcasts/{id}")
async def delete_podcast(id: str):
    """Deletes a podcast and all associated episodes, transcripts, and metadata."""
    # Find matching episodes
    cursor = db_instance.db["episodes"].find({"podcastId": id})
    episodes = await cursor.to_list(length=100)
    episode_ids = [e["id"] for e in episodes]

    # Delete podcast
    await db_instance.db["podcasts"].delete_one({"id": id})
    
    # Delete episodes
    await db_instance.db["episodes"].delete_many({"podcastId": id})
    
    # Delete associated datasets
    for ep_id in episode_ids:
        await db_instance.db["chat_history"].delete_many({"episodeId": ep_id})
        await db_instance.db["viral_clips"].delete_many({"episodeId": ep_id})
        await db_instance.db["audience_insights"].delete_many({"episodeId": ep_id})
        await db_instance.db["knowledge_data"].delete_many({"episodeId": ep_id})
        await db_instance.db["perspectives"].delete_many({"episodeId": ep_id})
        # Remove from vector store
        vector_store.chunks = [c for c in vector_store.chunks if c["episodeId"] != ep_id]
        if vector_store.vectors:
            keep_indices = [idx for idx, c in enumerate(vector_store.chunks) if c["episodeId"] != ep_id]
            vector_store.vectors = [vector_store.vectors[idx] for idx in keep_indices]
            
    vector_store.save_index()
    return {"success": True, "message": f"Deleted podcast {id} and all related records."}

# Background processing pipeline
async def process_uploaded_audio(
    file_path: str, podcast_id: str, episode_id: str, title: str, host: str, thumbnail_url: str
):
    try:
        # 1. Transcribe audio using Whisper
        logger.info(f"Background: Transcribing audio for {title}...")
        transcript = await whisper_service.transcribe_audio(file_path)
        
        # 2. Update podcast record with transcript
        await db_instance.db["podcasts"].update_one(
            {"id": podcast_id},
            {"$set": {"transcript": transcript}}
        )

        # 3. Extract acoustic features (Librosa + Pydub)
        logger.info(f"Background: Extracting audio features...")
        features = audio_service.extract_features(file_path)
        duration_sec = features["duration_seconds"]
        
        # Convert seconds to standard MM:SS
        dur_min = duration_sec // 60
        dur_sec = duration_sec % 60
        duration_str = f"{dur_min:02d}:{dur_sec:02d}"

        # Update episode duration in database
        await db_instance.db["episodes"].update_one(
            {"id": episode_id},
            {"$set": {"duration": duration_str, "durationSeconds": duration_sec}}
        )

        # 4. Generate Semantic Index Chunks (FAISS RAG)
        logger.info(f"Background: Rebuilding FAISS Index...")
        await rag_service.index_transcript(episode_id, transcript)

        # 5. Extract Analytics & Viral highlights
        logger.info(f"Background: Detecting viral moments...")
        clips = await analytics_service.extract_viral_clips(episode_id, transcript, thumbnail_url)
        await db_instance.db["viral_clips"].insert_one({
            "episodeId": episode_id,
            "clips": clips
        })

        # 6. Generate Audience retention curves
        logger.info(f"Background: Modeling engagement insights...")
        insights = audio_service.generate_retention_data(features)
        insights["episodeId"] = episode_id
        await db_instance.db["audience_insights"].insert_one(insights)

        # 7. Generate Knowledge Engine deliverables (flashcards, quiz, summary, mindmap)
        logger.info(f"Background: Compiling structured learning items...")
        knowledge = await knowledge_service.generate_knowledge_assets(episode_id, transcript, host, title)
        knowledge["episodeId"] = episode_id
        await db_instance.db["knowledge_data"].insert_one(knowledge)

        # 8. Generate Perspectives
        logger.info(f"Background: Generating perspectives...")
        persp = knowledge_service.generate_perspectives(episode_id, title, host, transcript)
        persp["episodeId"] = episode_id
        await db_instance.db["perspectives"].insert_one(persp)

        logger.info(f"Background processing complete for upload: {title}")
    except Exception as e:
        logger.error(f"Error in background processing pipeline for {title}: {e}")

@router.post("/upload")
async def upload_podcast_file(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    host: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    duration: Optional[str] = Form("45:00"),
    file: UploadFile = File(...),
    thumbnail: Optional[UploadFile] = File(None)
):
    """Endpoints to upload audio podcast files. Kickstarts background transcribing, RAG indexing, and analytic jobs."""
    # Create unique IDs
    podcast_id = f"p{uuid.uuid4().hex[:6]}"
    episode_id = f"e{uuid.uuid4().hex[:6]}"
    
    # Standard directories
    audio_path = os.path.join(settings.UPLOAD_DIR, f"{episode_id}_{file.filename}")
    with open(audio_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    thumbnail_url = "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80"
    if thumbnail:
        thumb_path = os.path.join(settings.UPLOAD_DIR, f"{podcast_id}_{thumbnail.filename}")
        with open(thumb_path, "wb") as f:
            shutil.copyfileobj(thumbnail.file, f)
        thumbnail_url = f"/uploads/{podcast_id}_{thumbnail.filename}"

    # Insert initial stub podcast records to DB (user sees them spinning or updating immediately)
    podcast_doc = {
        "id": podcast_id,
        "title": title,
        "host": host,
        "description": description,
        "thumbnail": thumbnail_url,
        "uploadDate": get_current_date(),
        "category": category,
        "duration": duration,
        "episodesCount": 1,
        "plays": "0",
        "likes": "0",
        "shares": "0",
        "isUserUploaded": True,
        "transcript": "Transcribing audio... Please wait."
    }
    
    episode_doc = {
        "id": episode_id,
        "podcastId": podcast_id,
        "title": f"{title} - Episode 1",
        "duration": duration,
        "durationSeconds": 2700, # default placeholder
        "plays": "0",
        "likes": "0",
        "uploadDate": get_current_date(),
        "thumbnail": thumbnail_url,
        "host": host,
        "audioUrl": f"/uploads/{episode_id}_{file.filename}"
    }

    await db_instance.db["podcasts"].insert_one(podcast_doc)
    await db_instance.db["episodes"].insert_one(episode_doc)

    # Queue transcription and feature extraction as background task
    background_tasks.add_task(
        process_uploaded_audio,
        file_path=audio_path,
        podcast_id=podcast_id,
        episode_id=episode_id,
        title=title,
        host=host,
        thumbnail_url=thumbnail_url
    )

    return {"success": True, "podcast": podcast_doc, "episode": episode_doc}

@router.post("/chat", response_model=ChatResponse)
async def chat_with_podcast(request: ChatRequest):
    """Converses with specific podcast episodes using RAG retrieval context."""
    # Fetch chat history
    cursor = db_instance.db["chat_history"].find({"episodeId": request.episode_id}).sort("created_at", 1)
    history_docs = await cursor.to_list(length=30)
    
    chat_history = [
        {"role": doc["role"], "content": doc["content"]}
        for doc in history_docs
    ]

    # Run query
    result = await rag_service.query_rag(
        episode_id=request.episode_id,
        query=request.message,
        chat_history=chat_history
    )

    # Save user message
    user_doc = {
        "id": f"msg-{uuid.uuid4().hex[:8]}",
        "episodeId": request.episode_id,
        "role": "user",
        "content": request.message,
        "timestamp": datetime.datetime.now().strftime("%H:%M"),
        "created_at": datetime.datetime.now()
    }
    await db_instance.db["chat_history"].insert_one(user_doc)

    # Save bot response
    bot_doc = {
        "id": f"msg-{uuid.uuid4().hex[:8]}",
        "episodeId": request.episode_id,
        "role": "assistant",
        "content": result["content"],
        "timestamp": result["timestamp"],
        "sources": result["sources"],
        "created_at": datetime.datetime.now()
    }
    await db_instance.db["chat_history"].insert_one(bot_doc)

    return ChatResponse(
        id=bot_doc["id"],
        role="assistant",
        content=result["content"],
        timestamp=result["timestamp"],
        sources=[SourceMetadata(**s) for s in result["sources"]]
    )

@router.get("/history/{episode_id}", response_model=List[ChatResponse])
async def get_chat_history(episode_id: str):
    """Retrieves chat history for a podcast episode."""
    cursor = db_instance.db["chat_history"].find({"episodeId": episode_id}).sort("created_at", 1)
    history = await cursor.to_list(length=100)
    
    res = []
    for h in history:
        sources_list = []
        if "sources" in h and h["sources"]:
            sources_list = [SourceMetadata(**s) for s in h["sources"]]
        res.append(ChatResponse(
            id=h.get("id"),
            role=h.get("role"),
            content=h.get("content"),
            timestamp=h.get("timestamp"),
            sources=sources_list
        ))
    return res

@router.post("/digital-twin/create")
async def create_digital_twin(request: HostTwinCreateRequest):
    """Extracts personality profile from transcripts to initialize the AI Host Twin agent."""
    episode = await db_instance.db["episodes"].find_one({"id": request.episode_id})
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found.")
        
    podcast = await db_instance.db["podcasts"].find_one({"id": episode["podcastId"]})
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found.")

    transcript = podcast.get("transcript", "")
    profile = await host_twin_agent.analyze_host_style(transcript, episode.get("host", "Alex Carter"))
    
    # Save twin profile to DB
    profile["hostName"] = episode.get("host", "Alex Carter")
    profile["episodeId"] = request.episode_id
    profile["created_at"] = datetime.datetime.now()
    
    await db_instance.db["twin_profiles"].update_one(
        {"episodeId": request.episode_id},
        {"$set": profile},
        upsert=True
    )
    return profile

@router.post("/digital-twin/chat")
async def chat_with_digital_twin(
    message: str = Form(...),
    personality: str = Form("Professional"), # Casual, Professional, Debate Mode
    episode_id: str = Form(...)
):
    """Chats with host digital twin using style analysis and retrieved context."""
    try:
        # Find profile
        profile = await db_instance.db["twin_profiles"].find_one({"episodeId": episode_id})
        if not profile:
            # Create profile dynamically
            profile = await create_digital_twin(HostTwinCreateRequest(episode_id=episode_id))

        # Retrieve relevant transcript chunks
        retrieved_hits = await vector_store.search(
            query=message,
            episode_id=episode_id,
            limit=2,
            client_openai=openai_wrapper.client
        )

        # Fetch twin chat history
        cursor = db_instance.db["twin_history"].find({"episodeId": episode_id}).sort("created_at", 1)
        history_docs = await cursor.to_list(length=10)
        chat_history = [{"role": d["role"], "content": d["content"]} for d in history_docs]

        # Generate response
        response_content = await host_twin_agent.generate_twin_response(
            message=message,
            personality_mode=personality,
            host_name=profile.get("hostName", "Alex Carter"),
            style_profile=profile,
            retrieved_contexts=retrieved_hits,
            chat_history=chat_history
        )

        # Save history
        user_doc = {
            "episodeId": episode_id,
            "role": "user",
            "content": message,
            "created_at": datetime.datetime.now()
        }
        await db_instance.db["twin_history"].insert_one(user_doc)

        bot_doc = {
            "episodeId": episode_id,
            "role": "assistant",
            "content": response_content,
            "created_at": datetime.datetime.now()
        }
        await db_instance.db["twin_history"].insert_one(bot_doc)

        # format output with sources
        sources = [
            {"text": hit["chunk"]["text"], "score": hit["score"], "timestamp": hit["timestamp"]}
            for hit in retrieved_hits
        ]

        return {
            "role": "assistant",
            "content": response_content,
            "timestamp": datetime.datetime.now().strftime("%I:%M %p"),
            "sources": sources
        }
    except Exception as e:
        logger.exception("Error in /digital-twin/chat handler")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/twin-history/{episode_id}", response_model=List[ChatResponse])
async def get_twin_history(episode_id: str):
    """Retrieves chat history for the Digital Twin."""
    cursor = db_instance.db["twin_history"].find({"episodeId": episode_id}).sort("created_at", 1)
    history = await cursor.to_list(length=100)
    return [
        {
            "id": h.get("id"),
            "role": h.get("role", "assistant"),
            "content": h.get("content", ""),
            "timestamp": h.get("created_at").strftime("%I:%M %p") if isinstance(h.get("created_at"), datetime.datetime) else h.get("timestamp", ""),
            "sources": h.get("sources", []) or []
        }
        for h in history
    ]

@router.get("/viral-clips/{episode_id}")
async def get_viral_clips(episode_id: str):
    """Retrieves detected viral clips for a specific episode."""
    doc = await db_instance.db["viral_clips"].find_one({"episodeId": episode_id})
    if not doc:
        # Try to generate dynamically from transcript
        ep = await db_instance.db["episodes"].find_one({"id": episode_id})
        pod = await db_instance.db["podcasts"].find_one({"id": ep["podcastId"]}) if ep else None
        if pod and pod.get("transcript"):
            clips = await analytics_service.extract_viral_clips(episode_id, pod["transcript"], ep.get("thumbnail"))
            await db_instance.db["viral_clips"].insert_one({"episodeId": episode_id, "clips": clips})
            return clips
        return []
    return doc.get("clips", [])

@router.get("/engagement-analysis/{episode_id}")
async def get_engagement_analysis(episode_id: str):
    """Retrieves speaking speeds, silences, and retention curve lists."""
    doc = await db_instance.db["audience_insights"].find_one({"episodeId": episode_id})
    if not doc:
        # Generate dynamic mock data
        ep = await db_instance.db["episodes"].find_one({"id": episode_id})
        duration = ep.get("durationSeconds", 1800) if ep else 1800
        features = {"speaking_speed": 140.0, "silence_duration": 15.0, "emotional_intensity": 60.0, "duration_seconds": duration}
        insights = audio_service.generate_retention_data(features)
        insights["episodeId"] = episode_id
        await db_instance.db["audience_insights"].insert_one(insights)
        return insights
    # Strip MongoDB _id key
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.get("/knowledge-engine/{episode_id}")
async def get_knowledge_assets(episode_id: str):
    """Retrieves structured summary, quizzes, flashcards, and mindmap."""
    doc = await db_instance.db["knowledge_data"].find_one({"episodeId": episode_id})
    if not doc:
        # Try to generate dynamically
        ep = await db_instance.db["episodes"].find_one({"id": episode_id})
        pod = await db_instance.db["podcasts"].find_one({"id": ep["podcastId"]}) if ep else None
        if pod and pod.get("transcript"):
            knowledge = await knowledge_service.generate_knowledge_assets(
                episode_id, pod["transcript"], ep.get("host", "Alex Carter"), ep.get("title", "Episode")
            )
            knowledge["episodeId"] = episode_id
            await db_instance.db["knowledge_data"].insert_one(knowledge)
            return knowledge
        return None
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.get("/perspectives/{episode_id}")
async def get_multiverse_perspectives(episode_id: str):
    """Retrieves cognitive perspective modes (beginner, founder, expert, critical)."""
    doc = await db_instance.db["perspectives"].find_one({"episodeId": episode_id})
    if not doc:
        # Generate dynamically
        ep = await db_instance.db["episodes"].find_one({"id": episode_id})
        pod = await db_instance.db["podcasts"].find_one({"id": ep["podcastId"]}) if ep else None
        transcript = pod.get("transcript", "") if pod else ""
        persp = knowledge_service.generate_perspectives(
            episode_id, ep.get("title", "Episode") if ep else "Show", ep.get("host", "Host") if ep else "Host", transcript
        )
        persp["episodeId"] = episode_id
        await db_instance.db["perspectives"].insert_one(persp)
        return persp
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.get("/vector-db/stats", response_model=VectorDbStatsResponse)
async def get_vector_db_stats():
    """Retrieves vector store indexing statistics."""
    return VectorDbStatsResponse(**vector_store.get_stats())

@router.post("/vector-db/rebuild")
async def rebuild_vector_db_index(request: VectorDbSettingsRequest):
    """Applies new chunk size config, clears vector index, and rebuilds FAISS embedding store."""
    # Accept legacy provider names and normalize to backend provider values
    provider = request.provider
    if provider == "openai":
        provider = "gemini"

    vector_store.provider = provider
    vector_store.chunk_size = request.chunkSize
    vector_store.chunk_overlap = request.chunkOverlap
    vector_store.clear()

    # Find all transcripts in DB and re-index
    cursor = db_instance.db["podcasts"].find()
    podcasts = await cursor.to_list(length=100)
    
    for pod in podcasts:
        transcript = pod.get("transcript", "")
        # Find related episodes
        ep_cursor = db_instance.db["episodes"].find({"podcastId": pod["id"]})
        episodes = await ep_cursor.to_list(length=100)
        for ep in episodes:
            await vector_store.add_episode_transcript(
                episode_id=ep["id"],
                transcript=transcript,
                client_openai=openai_wrapper.client
            )
            
    return {"success": True, "stats": vector_store.get_stats()}

@router.get("/vector-db/search")
async def run_vector_search(query: str, episode_id: Optional[str] = None, limit: int = 5):
    """Manual similarity search directly in vector database."""
    ep_id = None if episode_id == "all" or not episode_id else episode_id
    results = await vector_store.search(
        query=query,
        episode_id=ep_id,
        limit=limit,
        client_openai=openai_wrapper.client
    )
    return results

# Authentication Security Dependency and Routes
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")
    email = payload["sub"]
    user = await db_instance.db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/register")
async def register_user(request: UserRegister):
    existing = await db_instance.db["users"].find_one({"email": request.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="This email is already registered.")
    
    password_hash = hash_password(request.password)
    user_doc = {
        "fullName": request.fullName,
        "email": request.email.lower(),
        "passwordHash": password_hash,
        "role": "Creator",
        "registrationDate": datetime.date.today().isoformat()
    }
    await db_instance.db["users"].insert_one(user_doc)
    
    # Generate JWT token
    token = create_access_token({"sub": request.email.lower()})
    return {
        "success": True,
        "token": token,
        "user": {
            "name": request.fullName,
            "email": request.email.lower(),
            "role": "Creator"
        }
    }

@router.post("/login")
async def login_user(request: UserLogin):
    user = await db_instance.db["users"].find_one({"email": request.email.lower()})
    if not user or not verify_password(request.password, user.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    token = create_access_token({"sub": user["email"]})
    return {
        "success": True,
        "token": token,
        "user": {
            "name": user["fullName"],
            "email": user["email"],
            "role": user.get("role", "Creator")
        }
    }

@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        fullName=current_user["fullName"],
        email=current_user["email"],
        role=current_user.get("role", "Creator"),
        registrationDate=current_user.get("registrationDate", "")
    )

