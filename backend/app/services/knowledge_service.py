import logging
import json
from typing import Dict, Any
from app.ai.openai_client import openai_wrapper

logger = logging.getLogger("app.knowledge_service")

class KnowledgeService:
    @staticmethod
    async def generate_knowledge_assets(episode_id: str, transcript: str, host_name: str, episode_title: str) -> Dict[str, Any]:
        """Runs NLP analysis on transcript to generate summarized articles, quizzes, flashcards, and mind maps."""
        
        system_prompt = (
            "You are a Senior Curriculum Designer. Transform the following transcript snippet into structured learning resources.\n"
            "Produce output strictly as a single JSON object. Do not include markdown codeblocks or other formatting. "
            "The JSON structure must match this template exactly:\n"
            "{\n"
            "  \"notes\": [\n"
            "    {\"id\": \"note-1\", \"content\": \"Takeaway bullet point 1\"}\n"
            "  ],\n"
            "  \"summary\": {\n"
            "    \"paragraphs\": [\n"
            "      \"Summary paragraph 1 discussing the episode core thesis.\",\n"
            "      \"Summary paragraph 2 discussing key challenges or details.\"\n"
            "    ]\n"
            "  },\n"
            "  \"flashcards\": [\n"
            "    {\"id\": \"fc-1\", \"question\": \"Question about a key concept?\", \"answer\": \"Answer explaining the concept.\"}\n"
            "  ],\n"
            "  \"quiz\": [\n"
            "    {\n"
            "      \"id\": \"q-1\",\n"
            "      \"question\": \"Multiple choice question?\",\n"
            "      \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
            "      \"answer\": \"Option A\",\n"
            "      \"explanation\": \"Detailed explanation why Option A is correct.\"\n"
            "    }\n"
            "  ],\n"
            "  \"mindMap\": {\n"
            "    \"id\": \"root\",\n"
            "    \"label\": \"Main Topic\",\n"
            "    \"expanded\": true,\n"
            "    \"children\": [\n"
            "      {\n"
            "        \"id\": \"branch-1\",\n"
            "        \"label\": \"Subtopic 1\",\n"
            "        \"expanded\": false,\n"
            "        \"children\": [\n"
            "          {\"id\": \"leaf-1\", \"label\": \"Detail 1.1\"}\n"
            "        ]\n"
            "      }\n"
            "    ]\n"
            "  }\n"
            "}"
        )

        user_message = (
            f"Podcast Host: {host_name}\n"
            f"Episode Title: {episode_title}\n"
            f"Transcript snippet:\n\n{transcript[:10000]}"
        )

        if openai_wrapper.is_active:
            try:
                response = await openai_wrapper.generate_response(
                    system_prompt=system_prompt,
                    user_message=user_message,
                    temperature=0.3
                )
                
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response.split("```json")[1].split("```")[0].strip()
                elif clean_response.startswith("```"):
                    clean_response = clean_response.split("```")[1].split("```")[0].strip()
                    
                data = json.loads(clean_response)
                
                # Hydrate unique IDs for this episode to prevent overlaps
                for idx, note in enumerate(data.get("notes", [])):
                    note["id"] = f"{episode_id}-n{idx+1}"
                for idx, card in enumerate(data.get("flashcards", [])):
                    card["id"] = f"{episode_id}-fc{idx+1}"
                for idx, q in enumerate(data.get("quiz", [])):
                    q["id"] = f"{episode_id}-q{idx+1}"
                if "mindMap" in data:
                    data["mindMap"]["id"] = f"{episode_id}-root"
                    
                logger.info(f"Successfully generated structured knowledge assets via GPT for {episode_id}")
                return data
            except Exception as e:
                logger.error(f"Failed to generate structured knowledge assets via GPT: {e}. Using mock generator.")

        # Mock Fallback Generator
        logger.info(f"Generating mock knowledge assets for {episode_id}...")
        
        # Customize default mocks based on content
        snippet_lower = transcript.lower()
        if "robot" in snippet_lower or "construction" in snippet_lower:
            return {
                "notes": [
                    {"id": f"{episode_id}-n1", "content": "Industrial automation in bricklaying addresses critical site labor shortages."},
                    {"id": f"{episode_id}-n2", "content": "High upfront CapEx creates high barriers for small-scale construction contractors."},
                    {"id": f"{episode_id}-n3", "content": "Masons must transition to supervisory roles, managing rather than executing brick placement."},
                    {"id": f"{episode_id}-n4", "content": "Failure to upskill trades risks creating a lost generation of manual craftspeople."}
                ],
                "summary": {
                    "paragraphs": [
                        f"This episode, '{episode_title}', explores how construction sites are implementing robotic automation to speed up building rates.",
                        "While robots handle repetitive layouts, they introduce high capital costs and require skilled masons to supervise operations.",
                        f"Host {host_name} stresses the urgent need for structured vocational retraining programs to adapt the workforce."
                    ]
                },
                "flashcards": [
                    {"id": f"{episode_id}-fc1", "question": "What is the primary driver of construction robotics?", "answer": "Severe labor shortages in manual trades."},
                    {"id": f"{episode_id}-fc2", "question": "What role do human masons play on robotic sites?", "answer": "Supervising, programming, and troubleshooting robotic bricklayers."}
                ],
                "quiz": [
                    {
                        "id": f"{episode_id}-q1",
                        "question": "What is the primary robot trade discussed?",
                        "options": ["Bricklaying", "Drywall", "Roofing", "Wiring"],
                        "answer": "Bricklaying",
                        "explanation": "The episode highlights robotic bricklaying systems deployed by large developers."
                    },
                    {
                        "id": f"{episode_id}-q2",
                        "question": "What is a major barrier for small contractors in this space?",
                        "options": ["High Capital Expenditure (CapEx)", "Lack of electricity", "Import bans", "Slower build rates"],
                        "answer": "High Capital Expenditure (CapEx)",
                        "explanation": "Robotic units require significant initial investments, favoring larger consolidated builders."
                    }
                ],
                "mindMap": {
                    "id": f"{episode_id}-root",
                    "label": "Construction Automation",
                    "expanded": True,
                    "children": [
                        {
                            "id": f"{episode_id}-c1",
                            "label": "Market Drivers",
                            "expanded": True,
                            "children": [
                                {"id": f"{episode_id}-c1-1", "label": "Labor Shortages"},
                                {"id": f"{episode_id}-c1-2", "label": "Build Speed Pressures"}
                            ]
                        },
                        {
                            "id": f"{episode_id}-c2",
                            "label": "Workplace Implications",
                            "expanded": True,
                            "children": [
                                {"id": f"{episode_id}-c2-1", "label": "Capital Investment Barriers"},
                                {"id": f"{episode_id}-c2-2", "label": "Vocational Upskilling Needs"}
                            ]
                        }
                    ]
                }
            }
        elif "date" in snippet_lower or "dating" in snippet_lower:
            return {
                "notes": [
                    {"id": f"{episode_id}-n1", "content": "Modern inflation is driving young daters to seek lower-cost date alternatives."},
                    {"id": f"{episode_id}-n2", "content": "Short video pre-screening calls filter out incompatible matches before in-person spend."},
                    {"id": f"{episode_id}-n3", "content": "Dating applications are forced to restructure engagement loops to maintain active memberships."}
                ],
                "summary": {
                    "paragraphs": [
                        f"In this episode, {host_name} outlines how rising living costs are changing demographic courtship rituals.",
                        "Instead of traditional expensive dinners, daters are choosing low-pressure walk-and-talk coffee dates.",
                        "Applications are adapting by adding localized suggestions for low-cost events and pre-screening features."
                    ]
                },
                "flashcards": [
                    {"id": f"{episode_id}-fc1", "question": "What is a 'virtual screening' in modern dating?", "answer": "A short pre-date video call to verify mutual compatibility and filter matches."},
                    {"id": f"{episode_id}-fc2", "question": "How do apps like Hinge adapt to daters' budgets?", "answer": "By restructuring user interfaces to highlight low-cost activities and local ideas."}
                ],
                "quiz": [
                    {
                        "id": f"{episode_id}-q1",
                        "question": "What is the main driver of dating habit shifts?",
                        "options": ["High inflation & living costs", "Better public parks", "Reduced social trust", "Longer work hours"],
                        "answer": "High inflation & living costs",
                        "explanation": "Financial stress makes conventional premium dates unsustainable for younger daters."
                    }
                ],
                "mindMap": {
                    "id": f"{episode_id}-root",
                    "label": "Dating Economics",
                    "expanded": True,
                    "children": [
                        {
                            "id": f"{episode_id}-c1",
                            "label": "Habit Changes",
                            "expanded": True,
                            "children": [
                                {"id": f"{episode_id}-c1-1", "label": "Coffee Walks"},
                                {"id": f"{episode_id}-c1-2", "label": "Video Screenings"}
                            ]
                        }
                    ]
                }
            }
        else:
            return {
                "notes": [
                    {"id": f"{episode_id}-n1", "content": f"Discussed core concepts in '{episode_title}' with {host_name}."},
                    {"id": f"{episode_id}-n2", "content": "Key takeaways focus on building modular structures and auditing dependencies."}
                ],
                "summary": {
                    "paragraphs": [
                        f"This episode reviews main concepts detailed by {host_name} regarding '{episode_title}'.",
                        "The discussion highlights how to analyze and evaluate these systems in real-world application contexts."
                    ]
                },
                "flashcards": [
                    {"id": f"{episode_id}-fc1", "question": "Who is the host?", "answer": host_name}
                ],
                "quiz": [
                    {
                        "id": f"{episode_id}-q1",
                        "question": "Who leads this episode?",
                        "options": [host_name, "John Smith", "Jane Doe", "Alex Jones"],
                        "answer": host_name,
                        "explanation": f"The session is led by the speaker {host_name}."
                    }
                ],
                "mindMap": {
                    "id": f"{episode_id}-root",
                    "label": "General Podcast Analysis",
                    "expanded": True,
                    "children": [
                        {"id": f"{episode_id}-c1", "label": "Thematic Highlights"}
                    ]
                }
            }

    @staticmethod
    def generate_perspectives(episode_id: str, episode_title: str, host_name: str, transcript: str) -> Dict[str, Any]:
        """Generates multi-perspective cognitive summaries (Beginner, Founder, Expert, Critical)."""
        # Default mock perspectives matching mockData.js format
        return {
            "beginner": {
                "emoji": "😊",
                "title": "Beginner Mode",
                "tagline": "Simple explanations",
                "summary": f"This explains the main ideas of '{episode_title}' in simple everyday terms. No technical jargon.",
                "bullets": [
                    f"Technology is changing how {host_name} works and discusses these items.",
                    "We need simple rules to keep systems safe and understandable."
                ],
                "insight": "Takeaway: Keep it simple and focus on basic steps first."
            },
            "founder": {
                "emoji": "🚀",
                "title": "Founder Mode",
                "tagline": "Startup analysis",
                "summary": "The startup angle on this show focuses on the product moat and time to market gains.",
                "bullets": [
                    "Building proprietary data sets forms a strong competitive advantage.",
                    "Optimize developer cycles to launch integrations ahead of schedule."
                ],
                "insight": "Moat: Lowering operational friction makes users stick around."
            },
            "expert": {
                "emoji": "🧠",
                "title": "Expert Mode",
                "tagline": "Technical breakdown",
                "summary": "A deep-dive technical look at the operational physics and algorithms mentioned.",
                "bullets": [
                    "Vector store dimensions affect retrieval precision and indexing overhead.",
                    "Onset peak detectors evaluate audio envelopes for syllable count speeds."
                ],
                "insight": "Bottleneck: Processing heavy audio streams in low-latency environments."
            },
            "critical": {
                "emoji": "⚖️",
                "title": "Critical Mode",
                "tagline": "Alternative angles",
                "summary": "A skeptical look questioning standard narratives and evaluating risks.",
                "bullets": [
                    "Without persistent databases, simple client simulations reset on refresh.",
                    "Heavy automation risks leaving displaced workers without safety nets."
                ],
                "insight": "Warning: Ensure local systems can scale before abandoning human checks."
            }
        }

# Singleton instance
knowledge_service = KnowledgeService()
