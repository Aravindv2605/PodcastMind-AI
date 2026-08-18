import os
import logging
import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.router import api_router_root
from app.database.mongodb import connect_to_mongo, close_mongo_connection, db_instance
from app.database.faiss_store import vector_store
from app.services.rag_service import rag_service
from app.services.audio_service import audio_service
from app.services.analytics_service import analytics_service
from app.services.knowledge_service import knowledge_service
from app.utils.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("app.main")

app = FastAPI(
    title="PodcastMind AI Backend",
    description="Intelligent Conversational Podcast Ecosystem API",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploads folder statically (to stream audio files to PodcastPlayer)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()
    await seed_database_if_empty()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

async def seed_database_if_empty():
    """Seeds the database with default podcasts, episodes, and RAG index if empty."""
    try:
        # Seed default user if empty
        user_count = await db_instance.db["users"].count_documents({})
        if user_count == 0:
            from app.utils.auth import hash_password
            default_user = {
                "fullName": "Aravindhan V",
                "email": "aravindhan@example.com",
                "passwordHash": hash_password("password123"),
                "role": "Creator",
                "registrationDate": datetime.date.today().isoformat()
            }
            await db_instance.db["users"].insert_one(default_user)
            logger.info("Default seed user created successfully.")

        podcast_count = await db_instance.db["podcasts"].count_documents({})
        if podcast_count > 0:
            logger.info("Database already seeded. Skipping initial seed.")
            return

        logger.info("Database is empty. Initiating seed process...")
        
        # We will import the standard list of 10 podcasts
        seed_podcasts = [
            {
                "id": "p1",
                "title": "Big Boss Interview: Robotics and the Lost Generation",
                "host": "Barratt Redrow",
                "description": "Analyzing the role of bricklaying robots in industrial construction and the shifting opportunities for a lost generation of skilled workers.",
                "thumbnail": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
                "uploadDate": "2026-05-27",
                "category": "Business",
                "duration": "48:05",
                "episodesCount": 1,
                "plays": "33,670",
                "likes": "2,770",
                "shares": "1,220",
                "isUserUploaded": False,
                "transcript": "Welcome to Big Boss Interview. Today we're exploring bricklaying robots and the lost generation. As construction techniques transition towards heavy industrial automation, robotic solutions are stepping in. Let's analyze the economic limits and what it means for young craftspeople..."
            },
            {
                "id": "p2",
                "title": "Big Boss Interview: Hinge CEO on Dating Economics",
                "host": "Hinge CEO",
                "description": "Insights from Hinge's executive leadership on how the modern cost of living crunch is fundamentally shifting dating habits, user engagement, and relationship trends.",
                "thumbnail": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
                "uploadDate": "2026-06-03",
                "category": "Business",
                "duration": "57:39",
                "episodesCount": 1,
                "plays": "45,210",
                "likes": "3,890",
                "shares": "1,120",
                "isUserUploaded": False,
                "transcript": "Welcome to Big Boss Interview. Today we speak with the CEO of Hinge. Across major urban centers, dating dynamics are changing due to inflation and living expenses. Dating apps are restructuring their interfaces and engagement loops to cater to these new preferences..."
            },
            {
                "id": "p3",
                "title": "All In The Mind: Consciousness & Out-of-Body States",
                "host": "Dr. Ryan Vance",
                "description": "What do out-of-body experiences reveal about human neural pathways, self-perception, and cognitive models of consciousness?",
                "thumbnail": "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&auto=format&fit=crop&q=80",
                "uploadDate": "2026-05-19",
                "category": "Diet",
                "duration": "28:06",
                "episodesCount": 1,
                "plays": "18,070",
                "likes": "1,560",
                "shares": "690",
                "isUserUploaded": False,
                "transcript": "Welcome to All In The Mind. Today we explore out-of-body experiences. Cognitive science suggests that our spatial ego-location is constructed dynamically by sensory integration. When this loop is disrupted, consciousness separates from the bodily frame..."
            },
            {
                "id": "p4",
                "title": "All In The Mind: Fiction & Imagination Neuroscience",
                "host": "Dr. Ryan Vance",
                "description": "Evaluating neuroscience studies and psychological parameters detailing how reading fiction alters imagination, empathy, and long-term mental health.",
                "thumbnail": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=80",
                "uploadDate": "2026-05-26",
                "category": "Diet",
                "duration": "27:49",
                "episodesCount": 1,
                "plays": "21,390",
                "likes": "1,880",
                "shares": "710",
                "isUserUploaded": False,
                "transcript": "Welcome to All In The Mind. Today we examine the neuroscience of reading. Literary fiction acts as an active simulation for social cognition. Readers develop enhanced theory of mind capabilities, which directly corresponds to measurable mental resilience..."
            },
            {
                "id": "p5",
                "title": "Daily Mindset: Out-of-Body Experiences & Reality",
                "host": "Sarah Jenkins",
                "description": "Discussing how out-of-body perceptions challenge our psychological constructs of focus, perception, and personal reality.",
                "thumbnail": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
                "uploadDate": "2026-05-19",
                "category": "Motivation",
                "duration": "28:06",
                "episodesCount": 1,
                "plays": "24,190",
                "likes": "1,920",
                "shares": "850",
                "isUserUploaded": False,
                "transcript": "This is Daily Mindset Motivation. We discuss the boundaries of self. Our physical constraints don't limit our cognitive agility. By studying how the brain handles out-of-body disruptions, we can learn to de-anchor our focus and achieve peak performance..."
            },
            {
                "id": "p6",
                "title": "Daily Mindset: Fiction Reading & Mental Endurance",
                "host": "Sarah Jenkins",
                "description": "Analyzing the cognitive benefits of narrative immersion as a tool for empathy, vocabulary acquisition, and stress reduction.",
                "thumbnail": "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600&auto=format&fit=crop&q=80",
                "uploadDate": "2026-05-26",
                "category": "Motivation",
                "duration": "27:49",
                "episodesCount": 1,
                "plays": "19,840",
                "likes": "1,620",
                "shares": "590",
                "isUserUploaded": False,
                "transcript": "This is Daily Mindset Motivation. Today we cover mental endurance. Engaging with fiction stretches our attention span. It forces us to construct mental maps over time, fighting the instant gratification loops that degrade modern focus..."
            },
            {
                "id": "p7",
                "title": "The Documentary: Africa's Football Dreamers",
                "host": "BBC World Service",
                "description": "Investigating the dreams, training academies, and harsh realities of young African football players seeking life-changing European contracts.",
                "thumbnail": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80",
                "uploadDate": "2026-05-31",
                "category": "Story",
                "duration": "49:15",
                "episodesCount": 1,
                "plays": "17,380",
                "likes": "1,540",
                "shares": "540",
                "isUserUploaded": False,
                "transcript": "Welcome to The Documentary. Today we report from Accra, Ghana, tracking Africa's football dreamers. Across the continent, local academies promise paths to major European stadiums. But the market is highly competitive, and only a tiny fraction escape the cycle..."
            },
            {
                "id": "p8",
                "title": "The Documentary: Good Bad Billionaire - Beyonce",
                "host": "BBC World Service",
                "description": "Evaluating the financial empire, branding genius, and complex cultural legacy of Beyonce Knowles-Carter as a global business icon.",
                "thumbnail": "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80",
                "uploadDate": "2026-06-03",
                "category": "Story",
                "duration": "45:18",
                "episodesCount": 1,
                "plays": "29,540",
                "likes": "2,890",
                "shares": "920",
                "isUserUploaded": False,
                "transcript": "Welcome to The Documentary. Today we look at Beyonce's billionaire business structure. From music publishing rights to apparel lines and touring economics, she has redefined how artists control their supply chains and retain corporate leverage..."
            },
            {
                "id": "p9",
                "title": "Deep Breathwork & Meditation",
                "host": "Yogi Breath",
                "description": "A restorative guided breathing practice focusing on diaphragmatic expansion, oxygen flow, and mindfulness.",
                "thumbnail": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80",
                "uploadDate": "2026-06-04",
                "category": "Yoga",
                "duration": "1:03:59",
                "episodesCount": 1,
                "plays": "12,330",
                "likes": "990",
                "shares": "410",
                "isUserUploaded": False,
                "transcript": "Welcome. Find a comfortable posture, relax your shoulders, and close your eyes. We begin with a deep, slow inhalation, drawing the breath deep into the belly. Hold for four seconds, and release gently, letting go of all stress..."
            },
            {
                "id": "p10",
                "title": "Interoception Nidra Mindfulness Session",
                "host": "Nidra Guide",
                "description": "A calming body scan and restorative mindfulness guide focusing on interoceptive bodily awareness and physical relaxation.",
                "thumbnail": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80",
                "uploadDate": "2026-02-04",
                "category": "Yoga",
                "duration": "14:44",
                "episodesCount": 1,
                "plays": "9,910",
                "likes": "880",
                "shares": "340",
                "isUserUploaded": False,
                "transcript": "Settle down. Ensure your body is completely supported. Welcome to interoception nidra. Bring your attention to the breath, then let your awareness sweep through your physical form, sensing gravity and releasing muscle groups sequentially..."
            }
        ]

        audio_urls = [
            "/podcast/business/BigBossInterview-20260527-41BarrattRedrowCEOBricklayingRobotsTheLostGeneration.mp3",
            "/podcast/business/BigBossInterview-20260603-42HingeCEOTheCostOfLivingCrunchIsChangingHowWeDate.mp3",
            "/podcast/diet/AllInTheMind-20260519-WhatDoOutOfBodyExperiencesTellUsAboutConsciousness.mp3",
            "/podcast/diet/AllInTheMind-20260526-HowDoesReadingFictionImpactOurImaginationAndMentalHealth.mp3",
            "/podcast/motivation/AllInTheMind-20260519-WhatDoOutOfBodyExperiencesTellUsAboutConsciousness.mp3",
            "/podcast/motivation/AllInTheMind-20260526-HowDoesReadingFictionImpactOurImaginationAndMentalHealth.mp3",
            "/podcast/story/TheDocumentaryPodcast-20260531-AfricasFootballDreamers.mp3",
            "/podcast/story/TheDocumentaryPodcast-20260603-GoodBadBillionaireBeyonce.mp3",
            "/podcast/yoga/deep_into_the_breath.mp3",
            "/podcast/yoga/Interoception_Nidra_-_02042026_15.18.mp3"
        ]

        seed_episodes = [
            {
                "id": f"e{idx+1}",
                "podcastId": f"p{idx+1}",
                "title": f"Episode 1: {p['title'].split(': ')[-1] if ':' in p['title'] else p['title']}",
                "duration": p["duration"],
                "durationSeconds": 2885 if idx == 0 else (3459 if idx == 1 else (1686 if idx in (2, 4) else (1669 if idx in (3, 5) else (2955 if idx == 6 else (2718 if idx == 7 else (3839 if idx == 8 else 884)))))),
                "plays": p["plays"],
                "likes": p["likes"],
                "uploadDate": p["uploadDate"],
                "thumbnail": p["thumbnail"],
                "host": p["host"],
                "audioUrl": audio_urls[idx]
            }
            for idx, p in enumerate(seed_podcasts)
        ]

        # Insert Podcasts and Episodes
        await db_instance.db["podcasts"].insert_many(seed_podcasts)
        await db_instance.db["episodes"].insert_many(seed_episodes)
        logger.info(f"Inserted {len(seed_podcasts)} seed podcasts and episodes.")

        # Seed related analytical models using mock generators
        for idx, ep in enumerate(seed_episodes):
            ep_id = ep["id"]
            title = ep["title"]
            host = ep["host"]
            transcript = seed_podcasts[idx]["transcript"]
            thumbnail = ep["thumbnail"]
            duration_sec = ep["durationSeconds"]
            
            # 1. Index transcript
            await rag_service.index_transcript(ep_id, transcript)
            
            # 2. Viral Clips
            clips = await analytics_service.extract_viral_clips(ep_id, transcript, thumbnail)
            await db_instance.db["viral_clips"].insert_one({"episodeId": ep_id, "clips": clips})
            
            # 3. Audience Insights
            features = {"speaking_speed": 135.0, "silence_duration": 15.0, "emotional_intensity": 60.0, "duration_seconds": duration_sec}
            insights = audio_service.generate_retention_data(features)
            insights["episodeId"] = ep_id
            await db_instance.db["audience_insights"].insert_one(insights)
            
            # 4. Knowledge Engine Assets
            knowledge = await knowledge_service.generate_knowledge_assets(ep_id, transcript, host, title)
            knowledge["episodeId"] = ep_id
            await db_instance.db["knowledge_data"].insert_one(knowledge)
            
            # 5. Perspectives
            persp = knowledge_service.generate_perspectives(ep_id, title, host, transcript)
            persp["episodeId"] = ep_id
            await db_instance.db["perspectives"].insert_one(persp)

        logger.info("Database seeding successfully completed!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")

# Register root router
app.include_router(api_router_root)
