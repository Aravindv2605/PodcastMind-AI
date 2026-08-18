from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatRequest(BaseModel):
    message: str
    episode_id: str

class SourceMetadata(BaseModel):
    text: str
    score: float
    timestamp: str

class ChatResponse(BaseModel):
    id: Optional[str] = None
    role: str = "assistant"
    content: str
    timestamp: str
    sources: Optional[List[SourceMetadata]] = None

class HostTwinCreateRequest(BaseModel):
    episode_id: str

class HostTwinChatRequest(BaseModel):
    message: str

class VectorDbSettingsRequest(BaseModel):
    provider: str = "local-tfidf"  # "local-tfidf" or "gemini"
    chunkSize: int = 3
    chunkOverlap: int = 1

class VectorDbStatsResponse(BaseModel):
    provider: str
    totalChunks: int
    episodesCount: int
    dimensions: int
    chunkSize: int
    chunkOverlap: int
    vocabularySize: int

# Database representation schemas
class EpisodeSchema(BaseModel):
    id: str
    podcastId: str
    title: str
    duration: str
    durationSeconds: int
    plays: str = "0"
    likes: str = "0"
    uploadDate: str
    thumbnail: str
    host: str
    audioUrl: str

class PodcastSchema(BaseModel):
    id: str
    title: str
    host: str
    description: str
    thumbnail: str
    uploadDate: str
    category: str
    duration: str
    episodesCount: int = 1
    plays: str = "0"
    likes: str = "0"
    shares: str = "0"
    isUserUploaded: bool = True
    transcript: str = ""

class UserRegister(BaseModel):
    fullName: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    fullName: str
    email: str
    role: Optional[str] = "Creator"
    registrationDate: str

