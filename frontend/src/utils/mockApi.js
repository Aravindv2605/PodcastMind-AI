// Mock API client to simulate backend network requests
// You can replace these implementations with real 'fetch' calls to your backend server in the future.

import { 
  mockPodcasts, 
  mockEpisodes, 
  mockViralClips, 
  mockEmotionTimeline, 
  mockKnowledge, 
  mockAudienceInsights, 
  mockPerspectives 
} from "./mockData";

// Simulate network delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  // GET /api/podcasts
  getPodcasts: async () => {
    await delay(600);
    return [...mockPodcasts];
  },

  // POST /api/upload
  uploadPodcast: async (formData) => {
    await delay(2000); // Simulate processing delay
    const title = formData.get("title") || "New Podcast";
    const host = formData.get("host") || "Alex Carter";
    const category = formData.get("category") || "Technology";
    const description = formData.get("description") || "Uploaded podcast file analysis.";
    const duration = formData.get("duration") || "45:00";
    const thumbnail = formData.get("thumbnail") || null;

    return {
      success: true,
      podcast: {
        title,
        host,
        category,
        description,
        duration,
        thumbnail
      }
    };
  },

  // POST /api/chat
  chatWithPodcast: async (episodeId, message) => {
    await delay(1200);
    let reply = "I've analyzed the transcript segment. The speaker notes that the core challenge of scaling autonomous multi-agent networks lies in maintaining task boundary safety and memory synchrony.";
    
    if (message.toLowerCase().includes("agentic")) {
      reply = "Agentic AI refers to systems that can plan, execute, evaluate, and self-correct across multi-turn processes, operating independently using tools to achieve goals.";
    } else if (message.toLowerCase().includes("viral")) {
      reply = "The viral clips dashboard highlighted quote: 'AI won't replace humans, but humans with AI will replace humans without AI.' with a 96% score.";
    }
    return {
      role: "assistant",
      content: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  },

  // GET /api/clips/:id
  getClips: async (episodeId) => {
    await delay(500);
    return mockViralClips[episodeId] || [];
  },

  // GET /api/emotions/:id
  getEmotions: async (episodeId) => {
    await delay(700);
    return mockEmotionTimeline[episodeId] || [];
  },

  // GET /api/insights/:id
  getInsights: async (episodeId) => {
    await delay(800);
    return mockAudienceInsights[episodeId] || null;
  },

  // GET /api/knowledge/:id
  getKnowledge: async (episodeId) => {
    await delay(600);
    return mockKnowledge[episodeId] || null;
  },

  // GET /api/perspectives/:id
  getPerspectives: async (episodeId) => {
    await delay(650);
    return mockPerspectives[episodeId] || null;
  }
};
