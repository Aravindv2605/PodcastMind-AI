import logging
import datetime
import re
from typing import List, Dict, Any, Optional
from app.database.faiss_store import vector_store
from app.database.mongodb import db_instance
from app.ai.openai_client import openai_wrapper

logger = logging.getLogger("app.rag_service")

SUMMARY_QUERY_PATTERNS = (
    r"\bkey takeaways?\b",
    r"\bsummary\b",
    r"\bmain points?\b",
    r"\bmain topic\b",
    r"\bgive me a summary\b",
    r"\bexplain the main topic\b",
    r"\bwhat is this episode about\b",
)


class RagService:
    @staticmethod
    def _is_summary_query(query: str) -> bool:
        normalized = query.lower().strip()
        return any(re.search(pattern, normalized) for pattern in SUMMARY_QUERY_PATTERNS)

    @staticmethod
    async def _get_episode_context(episode_id: str) -> Dict[str, Any]:
        episode = await db_instance.db["episodes"].find_one({"id": episode_id})
        if not episode:
            return {"title": "Episode", "host": "Host", "transcript": ""}

        podcast = await db_instance.db["podcasts"].find_one({"id": episode.get("podcastId")})
        transcript = (podcast or {}).get("transcript", "")
        return {
            "title": episode.get("title") or (podcast or {}).get("title", "Episode"),
            "host": episode.get("host") or (podcast or {}).get("host", "Host"),
            "transcript": transcript or "",
        }

    @staticmethod
    async def _get_knowledge_context(episode_id: str) -> str:
        doc = await db_instance.db["knowledge_data"].find_one({"episodeId": episode_id})
        if not doc:
            return ""

        parts = []
        summary = doc.get("summary") or {}
        paragraphs = summary.get("paragraphs") or []
        if paragraphs:
            parts.append("Episode Summary:\n" + "\n".join(f"- {p}" for p in paragraphs))

        notes = doc.get("notes") or []
        if notes:
            parts.append(
                "Key Notes:\n" + "\n".join(
                    f"- {note.get('content', '')}" for note in notes if note.get("content")
                )
            )
        return "\n\n".join(parts)

    @staticmethod
    def _build_sources(retrieved_hits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [
            {
                "text": hit["chunk"]["text"],
                "score": hit["score"],
                "timestamp": hit["timestamp"],
            }
            for hit in retrieved_hits
        ]

    @staticmethod
    def _trim_chat_history(chat_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Keep only recent user turns to avoid repeating prior assistant answers."""
        if not chat_history:
            return []
        user_messages = [msg for msg in chat_history if msg.get("role") == "user"]
        return user_messages[-2:]

    @staticmethod
    async def index_transcript(episode_id: str, transcript: str):
        """Indexes transcript chunks in the vector store."""
        await vector_store.add_episode_transcript(
            episode_id=episode_id,
            transcript=transcript,
            client_openai=openai_wrapper.client,
        )
        logger.info(f"Successfully indexed transcript for episode {episode_id}.")

    @staticmethod
    def _build_fallback_response(
        query: str,
        episode_ctx: Dict[str, Any],
        retrieved_hits: List[Dict[str, Any]],
        knowledge_context: str,
        is_summary_query: bool,
    ) -> str:
        if is_summary_query and knowledge_context:
            return (
                "Here are the key takeaways from this episode:\n"
                + knowledge_context.replace("Episode Summary:", "").replace("Key Notes:", "").strip()
            )

        if retrieved_hits:
            top = retrieved_hits[0]
            supporting = retrieved_hits[1:3]
            answer = (
                f"Based on the podcast transcript around {top['timestamp']}: "
                f"{top['chunk']['text']}"
            )
            if supporting:
                extra = " ".join(
                    f"Additionally, at {hit['timestamp']}: {hit['chunk']['text']}"
                    for hit in supporting
                )
                answer = f"{answer} {extra}"
            return answer

        transcript = episode_ctx.get("transcript", "")
        if transcript:
            return (
                f"From the episode \"{episode_ctx['title']}\", the transcript discusses: "
                f"{transcript[:700]}{'...' if len(transcript) > 700 else ''}"
            )

        return (
            "I couldn't reach Gemini right now, and no transcript context was available "
            f"to answer: {query}"
        )

    @staticmethod
    async def query_rag(
        episode_id: str,
        query: str,
        chat_history: List[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Queries the RAG system and generates a context-aware response."""
        episode_ctx = await RagService._get_episode_context(episode_id)
        transcript = episode_ctx["transcript"]
        is_summary_query = RagService._is_summary_query(query)

        retrieved_hits = await vector_store.search(
            query=query,
            episode_id=episode_id,
            limit=5,
            client_openai=openai_wrapper.client,
        )

        max_score = max((hit["score"] for hit in retrieved_hits), default=0.0)
        episode_chunks = vector_store.get_episode_chunks(episode_id)
        knowledge_context = await RagService._get_knowledge_context(episode_id) if is_summary_query else ""

        context_sections = []
        if knowledge_context:
            context_sections.append(knowledge_context)

        if retrieved_hits and max_score >= 0.08:
            context_sections.append(
                "Most Relevant Transcript Segments:\n"
                + "\n".join(
                    f"- [{hit['timestamp']}] (relevance: {hit['score']:.2f}) {hit['chunk']['text']}"
                    for hit in retrieved_hits
                )
            )
        elif episode_chunks:
            context_sections.append(
                "Full Episode Transcript Segments:\n"
                + "\n".join(
                    f"- [{vector_store.calculate_timestamp(chunk, episode_id)}] {chunk['text']}"
                    for chunk in episode_chunks
                )
            )
        elif transcript:
            context_sections.append(f"Full Episode Transcript:\n{transcript}")

        context_str = "\n\n".join(section for section in context_sections if section.strip())

        if not context_str.strip():
            context_str = "No transcript context is available for this episode yet."

        system_prompt = (
            "You are PodcastMind AI, a podcast assistant powered by retrieval-augmented generation.\n"
            f"Episode: {episode_ctx['title']}\n"
            f"Host: {episode_ctx['host']}\n\n"
            "Use ONLY the context below to answer the user's current question.\n"
            "Rules:\n"
            "1. Answer the CURRENT question directly. Do not repeat a previous answer.\n"
            "2. Base your answer on the retrieved transcript context and episode notes.\n"
            "3. If the user asks for key takeaways or a summary, provide 3-5 distinct bullet-style points.\n"
            "4. If the user asks about a specific concept, explain that concept using matching transcript lines.\n"
            "5. Mention approximate timestamps when citing specific details.\n"
            "6. If the transcript does not contain enough detail, say what is known and what is missing.\n"
            "7. Keep the answer clear and concise. No JSON, no headings, no metadata.\n\n"
            f"Retrieved Context:\n{context_str}"
        )

        trimmed_history = RagService._trim_chat_history(chat_history or [])

        try:
            response_content = await openai_wrapper.generate_response(
                system_prompt=system_prompt,
                user_message=query,
                chat_history=trimmed_history,
                temperature=0.35,
            )
        except Exception as e:
            logger.error(f"Gemini RAG generation failed, using transcript fallback: {e}")
            response_content = RagService._build_fallback_response(
                query=query,
                episode_ctx=episode_ctx,
                retrieved_hits=retrieved_hits,
                knowledge_context=knowledge_context,
                is_summary_query=is_summary_query,
            )

        sources = RagService._build_sources(retrieved_hits)
        if not sources and episode_chunks:
            sources = [
                {
                    "text": chunk["text"],
                    "score": 1.0,
                    "timestamp": vector_store.calculate_timestamp(chunk, episode_id),
                }
                for chunk in episode_chunks[:5]
            ]

        now = datetime.datetime.now()
        timestamp_str = now.strftime("%M:%S")

        return {
            "role": "assistant",
            "content": response_content,
            "timestamp": timestamp_str,
            "sources": sources,
        }


rag_service = RagService()
