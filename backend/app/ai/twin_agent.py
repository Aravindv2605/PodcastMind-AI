import logging
from typing import List, Dict, Any
from app.ai.openai_client import openai_wrapper

logger = logging.getLogger("app.twin_agent")

class HostTwinAgent:
    @staticmethod
    async def analyze_host_style(transcript: str, host_name: str) -> Dict[str, Any]:
        """Analyzes a podcast transcript to extract the host's personality and tone."""
        system_prompt = (
            "You are a linguistic analyst. Analyze the following transcript snippet to extract the speaking style, "
            f"speech patterns, vocabulary preferences, and tone of the host '{host_name}'. "
            "Output your analysis in a JSON structure containing: \n"
            "1. 'tone_description' (e.g., analytical, warm, skeptical)\n"
            "2. 'speech_patterns' (e.g., uses rhetorical questions, speaks in short bursts)\n"
            "3. 'frequent_phrases' (list of 3 key words or expressions they would use)\n"
            "4. 'summary_profile' (a short summary paragraph that can be used to describe their persona)"
        )
        
        snippet = transcript[:5000] if transcript else ""
        user_message = f"Here is the transcript of {host_name}:\n\n{snippet}"

        if openai_wrapper.is_active:
            try:
                # Call GPT to analyze the style
                response = await openai_wrapper.generate_response(
                    system_prompt=system_prompt,
                    user_message=user_message,
                    temperature=0.3
                )
                
                # Try to parse JSON from response, otherwise fallback to parsing text
                import json
                # Strip markdown blocks if any
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response.split("```json")[1].split("```")[0].strip()
                elif clean_response.startswith("```"):
                    clean_response = clean_response.split("```")[1].split("```")[0].strip()
                
                profile = json.loads(clean_response)
                logger.info(f"Generated twin style profile for host {host_name}")
                return profile
            except Exception as e:
                logger.error(f"Failed to parse GPT style analysis JSON: {e}")

        # Mock Fallback Profile
        logger.info(f"Generating mock style profile for host {host_name}")
        return {
            "tone_description": "insightful, conversational, and slightly provocative",
            "speech_patterns": "frequently uses conversational transitions like 'Honestly', 'Look at the data', 'At the end of the day'",
            "frequent_phrases": ["Honestly", "Look at the numbers", "At the end of the day"],
            "summary_profile": (
                f"An experienced interviewer who values hard statistics, practical startup moats, and is skeptical of "
                "over-engineered technical frameworks without clear market utility."
            )
        }

    @staticmethod
    async def generate_twin_response(
        message: str,
        personality_mode: str,
        host_name: str,
        style_profile: Dict[str, Any],
        retrieved_contexts: List[Dict[str, Any]],
        chat_history: List[Dict[str, Any]]
    ) -> str:
        """Generates a conversational response in the host's style using retrieved context chunks."""
        
        # Format retrieval context
        context_str = ""
        if retrieved_contexts:
            context_str = "\n\nRetrieved context from the recording:\n" + "\n".join(
                f"- [Segment at {c.get('timestamp', 'unknown')}]: \"{c['chunk']['text']}\""
                for c in retrieved_contexts
            )

        # Style rule adaptation based on personality settings
        personality_instructions = ""
        if "Casual" in personality_mode:
            personality_instructions = (
                "Speak in a friendly, relaxed, and conversational way. Keep answers simple, use informal phrasing "
                "(like 'Honestly', 'So look', 'At the end of the day'), and avoid over-engineering your sentences."
            )
        elif "Debate" in personality_mode:
            personality_instructions = (
                "Speak in an analytical, critical, and challenging manner. Push back on typical assumptions, "
                "question simple solutions, and ask provocative counter-questions to engage the user."
            )
        else: # Professional
            personality_instructions = (
                "Speak with authority, structure, and logical clarity. Focus on technical parameters, "
                "data points, and clear operational recommendations."
            )

        system_prompt = (
            f"You are the AI Digital Twin of {host_name}, the podcast host. You must speak in the first person ('I', 'my') as {host_name}.\n\n"
            f"Linguistic Style Profile:\n"
            f"- Tone: {style_profile.get('tone_description', 'conversational')}\n"
            f"- Patterns: {style_profile.get('speech_patterns', 'straightforward')}\n"
            f"- Phrases: {', '.join(style_profile.get('frequent_phrases', []))}\n"
            f"- Profile: {style_profile.get('summary_profile', '')}\n\n"
            f"Personality Mode Instructions:\n{personality_instructions}\n\n"
            f"Context Data: Use the following retrieved transcript context to answer the user's questions. "
            "Integrate these facts seamlessly into your dialogue. If the facts don't contain the answer, "
            "speak from your expertise as the host.\n"
            f"{context_str}\n\n"
            "Requirements:\n"
            "1. Respond directly as the host. Keep the tone conversational, authentic, and engaging.\n"
            "2. Keep answers concise (1-2 short paragraphs) suitable for a chat bubble.\n"
            "3. Do NOT use markdown title headers like '#' or system tags. Just speak."
        )

        try:
            response = await openai_wrapper.generate_response(
                system_prompt=system_prompt,
                user_message=message,
                chat_history=chat_history,
                temperature=0.85 if "Casual" in personality_mode else 0.5
            )
            return response
        except Exception as e:
            logger.error(f"AI generation failed for twin response: {e}")
            # Fallback: craft a concise reply using retrieved contexts if available
            if retrieved_contexts:
                snippet = retrieved_contexts[0]["chunk"]["text"]
                return f"I couldn't reach my reasoning engine, but based on the recording: {snippet[:240]}..."
            return "Sorry, I'm having trouble generating a response right now. Please try again shortly."

# Singleton instance
host_twin_agent = HostTwinAgent()
