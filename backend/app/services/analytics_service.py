import logging
import re
import json
from typing import List, Dict, Any
from app.ai.openai_client import openai_wrapper

logger = logging.getLogger("app.analytics_service")

class AnalyticsService:
    @staticmethod
    async def extract_viral_clips(episode_id: str, transcript: str, thumbnail: str = None) -> List[Dict[str, Any]]:
        """Identifies high-impact, emotionally charged highlight moments from a podcast transcript."""
        thumbnail = thumbnail or "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80"
        
        system_prompt = (
            "You are a viral social media video editor. Analyze the provided podcast transcript to isolate "
            "the top 2-3 most engaging, self-contained highlight quotes (about 1-2 sentences each) that would "
            "make great viral clips (Reels, TikToks).\n\n"
            "Output your findings in a JSON array. Each element should have: \n"
            "1. 'startTime' (format 'MM:SS' like '05:30', estimate based on position in transcript)\n"
            "2. 'startTimeSeconds' (integer, estimated start in seconds)\n"
            "3. 'endTime' (format 'MM:SS', estimated clip end)\n"
            "4. 'quote' (the exact text quote)\n"
            "5. 'viralScore' (an integer from 75 to 99 representing viral potential)\n"
            "6. 'emotion' (emoji + text category, e.g., '💡 Inspiration', '🔥 Excitement', '🤯 Surprise', '🧠 Mind-blown')"
        )

        user_message = f"Here is the transcript snippet:\n\n{transcript[:10000]}"

        if openai_wrapper.is_active:
            try:
                response = await openai_wrapper.generate_response(
                    system_prompt=system_prompt,
                    user_message=user_message,
                    temperature=0.6
                )
                
                # Parse JSON array
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response.split("```json")[1].split("```")[0].strip()
                elif clean_response.startswith("```"):
                    clean_response = clean_response.split("```")[1].split("```")[0].strip()
                    
                clips = json.loads(clean_response)
                
                # Hydrate clip IDs and thumbnails
                for idx, clip in enumerate(clips):
                    clip["id"] = f"clip-{episode_id}-{idx+1}"
                    clip["episodeId"] = episode_id
                    clip["thumbnail"] = thumbnail
                return clips
            except Exception as e:
                logger.error(f"Failed to generate viral clips via GPT: {e}. Falling back to rule-based mock.")

        # Mock Fallback Clips
        logger.info(f"Generating mock viral clips for episode {episode_id}...")
        
        # Simple pattern matching to find interesting quote snippets
        quotes = [
            "We are looking at a lost generation of manual craftspeople unless we implement proactive training programs.",
            "Honestly? An agent is just a script with a loop and a brain. If you give it standard tools, it gets the job done."
        ]
        
        # Adjust based on keywords
        snippet = transcript.lower()
        if "inflation" in snippet or "dating" in snippet:
            quotes = [
                "Dating has become a luxury item. Inflation is literally forcing young people to screen matches on video calls first.",
                "Apps must restructure their interface loops to highlight cheap local dates, or they will lose user engagement."
            ]
        elif "breath" in snippet or "vagus" in snippet:
            quotes = [
                "Diaphragmatic expansion is a physiological hack. You are manually suppressing fight-or-flight in seconds.",
                "Holding the breath after inhalation triggers vagal nerve stimulation, activating deep parasympathetic dominance."
            ]

        return [
            {
                "id": f"clip-{episode_id}-1",
                "episodeId": episode_id,
                "startTime": "00:30",
                "startTimeSeconds": 30,
                "endTime": "00:50",
                "quote": quotes[0],
                "viralScore": 91,
                "emotion": "💡 Inspiration",
                "thumbnail": thumbnail
            },
            {
                "id": f"clip-{episode_id}-2",
                "episodeId": episode_id,
                "startTime": "01:20",
                "startTimeSeconds": 80,
                "endTime": "01:45",
                "quote": quotes[1],
                "viralScore": 87,
                "emotion": "🔥 Excitement",
                "thumbnail": thumbnail
            }
        ]

    @staticmethod
    def generate_emotion_timeline(episode_id: str, duration_seconds: int = 1800) -> List[Dict[str, Any]]:
        """Generates an emotional intensity timeline mapped across the playback duration."""
        steps = 8
        timeline = []
        emotions = ["Curiosity", "Excitement", "Deep Thinking", "Surprise", "Joy"]
        quotes = [
            "Opening the discussion on technological transitions.",
            "Analyzing initial CapEx calculations and firm scaling limits.",
            "Evaluating standard workforce implications and worker retraining.",
            "Considering alternative viewpoints and contractor reactions.",
            "A surprising insight regarding regulatory compliance issues.",
            "Highlighting action items and strategic paths for developers.",
            "Summarizing final conclusions and core thesis takeaways.",
            "Concluding remarks and wrapping up the recording."
        ]

        for i in range(steps):
            time_sec = int((duration_seconds / (steps - 1)) * i)
            min_val = time_sec // 60
            sec_val = time_sec % 60
            time_str = f"{min_val:02d}:{sec_val:02d}"
            
            # Deterministic wave fluctuation
            excitement = int(45 + 30 * np.sin(i * 1.2) + (time_sec % 15))
            curiosity = int(50 + 25 * np.cos(i * 0.9) + (time_sec % 10))
            surprise = int(30 + 35 * np.sin(i * 1.5) + (time_sec % 12))
            deep_thinking = int(40 + 40 * np.cos(i * 0.6) + (time_sec % 8))
            joy = int(35 + 25 * np.sin(i * 1.8) + (time_sec % 14))

            # Normalize 0-100 bounds
            excitement = max(10, min(98, excitement))
            curiosity = max(10, min(98, curiosity))
            surprise = max(10, min(98, surprise))
            deep_thinking = max(10, min(98, deep_thinking))
            joy = max(10, min(98, joy))

            timeline.append({
                "timestamp": time_str,
                "timestampSeconds": time_sec,
                "excitement": excitement,
                "curiosity": curiosity,
                "surprise": surprise,
                "deepThinking": deep_thinking,
                "joy": joy,
                "quote": quotes[i % len(quotes)],
                "dominant": emotions[i % len(emotions)]
            })

        return timeline

# Singleton instance
analytics_service = AnalyticsService()
