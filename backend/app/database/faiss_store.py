import os
import json
import logging
import re
from typing import List, Dict, Any, Tuple
import numpy as np
from app.utils.config import settings
from app.ai.openai_client import openai_wrapper

logger = logging.getLogger("app.faiss_store")

# Attempt to import faiss, default to numpy if unavailable
try:
    import faiss
    FAISS_AVAILABLE = True
    logger.info("FAISS library loaded successfully.")
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("FAISS library not found. Falling back to NumPy-based vector operations.")

STOPWORDS = {
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
    "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", 
    "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", 
    "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", 
    "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", 
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", 
    "for", "with", "about", "against", "between", "into", "through", "during", "before", 
    "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", 
    "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", 
    "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", 
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", 
    "can", "will", "just", "don", "should", "now"
}

def tokenize(text: str) -> List[str]:
    clean = re.sub(r'[^\w\s]', ' ', text.lower())
    return [t for t in clean.split() if len(t) > 1 and t not in STOPWORDS]

QUERY_EXPANSIONS = {
    "key takeaways": ["summary", "main", "points", "takeaway", "conclusion", "learn", "discussed", "episode", "topic"],
    "key takeaway": ["summary", "main", "points", "takeaway", "conclusion", "learn", "discussed", "episode", "topic"],
    "main topic": ["summary", "main", "topic", "discussed", "episode", "about", "focus"],
    "give me a summary": ["summary", "main", "points", "overview", "discussed", "episode"],
    "explain the main topic": ["summary", "main", "topic", "discussed", "episode", "about"],
    "current timestamp": ["discussed", "segment", "moment", "topic", "episode"],
}

def expand_query_tokens(query: str) -> List[str]:
    normalized = query.lower().strip()
    tokens = set(tokenize(query))
    for phrase, extras in QUERY_EXPANSIONS.items():
        if phrase in normalized:
            tokens.update(extras)
    return list(tokens)

def keyword_overlap_score(query: str, text: str) -> float:
    query_tokens = set(expand_query_tokens(query))
    if not query_tokens:
        return 0.0
    text_tokens = set(tokenize(text))
    if not text_tokens:
        return 0.0
    overlap = len(query_tokens & text_tokens)
    return overlap / len(query_tokens)

class FaissVectorStore:
    def __init__(self, provider: str = "local-tfidf", chunk_size: int = 1, chunk_overlap: int = 0):
        # For stability during migration, default to local TF-IDF provider only
        # This avoids runtime dependency on Gemini embeddings until fully migrated.
        self.provider = provider
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # In-memory index structures
        self.chunks: List[Dict[str, Any]] = []
        self.vectors: List[np.ndarray] = []
        
        # TF-IDF variables
        self.vocabulary: List[str] = []
        self.idf: Dict[str, float] = {}
        
        # File paths for saving/loading
        self.index_file_path = os.path.join(settings.VECTOR_STORE_DIR, "index_metadata.json")
        self.vectors_file_path = os.path.join(settings.VECTOR_STORE_DIR, "vectors.npy")
        
        self.load_index()

    def chunk_text(self, text: str, episode_id: str) -> List[Dict[str, Any]]:
        if not text:
            return []
        
        # Split into sentences using punctuation markers
        sentences = [s.strip() for s in re.split(r'(?<=[.?!])\s+', text) if s.strip()]
        chunks = []
        i = 0
        
        while i < len(sentences):
            chunk_sentences = sentences[i : i + self.chunk_size]
            if not chunk_sentences:
                break
            
            chunk_text = " ".join(chunk_sentences)
            ratio_start = i / len(sentences)
            ratio_end = min(1.0, (i + len(chunk_sentences)) / len(sentences))
            
            chunks.append({
                "id": f"chunk-{episode_id}-{i}",
                "episodeId": episode_id,
                "text": chunk_text,
                "metadata": {
                    "startRatio": ratio_start,
                    "endRatio": ratio_end,
                    "sentenceIndex": i
                }
            })
            
            step = self.chunk_size - self.chunk_overlap
            i += step if step > 0 else 1
            
        return chunks

    def rebuild_tfidf(self):
        """Rebuilds TF-IDF vocabulary and vector weights for all indexed chunks."""
        doc_tokens = [tokenize(c["text"]) for c in self.chunks]
        df = {}
        vocab_set = Set = set()
        
        for tokens in doc_tokens:
            unique = set(tokens)
            for tok in unique:
                vocab_set.add(tok)
                df[tok] = df.get(tok, 0) + 1
                
        self.vocabulary = list(vocab_set)
        N = len(self.chunks)
        
        self.idf = {}
        for tok in self.vocabulary:
            self.idf[tok] = float(np.log(1 + N / df[tok]))
            
        # Re-vectorize existing chunks
        self.vectors = []
        for c in self.chunks:
            tokens = tokenize(c["text"])
            self.vectors.append(self.generate_tfidf_vector(tokens))
            
    def generate_tfidf_vector(self, tokens: List[str]) -> np.ndarray:
        if not self.vocabulary:
            return np.zeros(1, dtype=np.float32)
            
        tf = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
            
        vector = []
        for token in self.vocabulary:
            if token not in tf:
                vector.append(0.0)
            else:
                tf_val = tf[token] / len(tokens)
                idf_val = self.idf.get(token, 0.0)
                vector.append(tf_val * idf_val)
                
        arr = np.array(vector, dtype=np.float32)
        norm = np.linalg.norm(arr)
        if norm > 0:
            arr = arr / norm
        return arr

    async def _embed_with_gemini(self, texts: List[str], client_openai) -> List[np.ndarray]:
        if not client_openai:
            raise RuntimeError("Missing Gemini client for embedding generation.")

        logger.info("Generating Gemini embeddings for transcript chunks...")
        embeddings = openai_wrapper.create_embeddings(texts)
        vectors = [np.asarray(embed, dtype=np.float32) for embed in embeddings]
        return vectors

    async def add_episode_transcript(self, episode_id: str, transcript: str, client_openai = None):
        """Chunks a transcript, embeds the chunks, and updates the index."""
        # 1. Clear out existing chunks for this episode
        keep_indices = [idx for idx, c in enumerate(self.chunks) if c["episodeId"] != episode_id]
        self.chunks = [self.chunks[idx] for idx in keep_indices]
        if self.vectors:
            self.vectors = [self.vectors[idx] for idx in keep_indices]
            
        # 2. Chunk transcript
        new_chunks = self.chunk_text(transcript, episode_id)
        if not new_chunks:
            return

        self.chunks.extend(new_chunks)

        if self.provider == "gemini" and client_openai:
            try:
                chunk_texts = [c["text"] for c in new_chunks]
                self.vectors.extend(await self._embed_with_gemini(chunk_texts, client_openai))
                self.vocabulary = []
                self.idf = {}
            except Exception as e:
                logger.error(f"Gemini embedding generation failed: {e}. Falling back to local TF-IDF indexing.")
                self.rebuild_tfidf()
        else:
            logger.info(f"Generating local TF-IDF vectors for {len(new_chunks)} chunks of episode {episode_id}...")
            self.rebuild_tfidf()
            # Keep the vectors list updated by rebuild_tfidf

        self.save_index()

    async def _embed_query(self, query: str, client_openai) -> np.ndarray:
        if not client_openai:
            raise RuntimeError("Missing Gemini client for query embeddings.")

        query_embedding = openai_wrapper.create_embeddings([query])
        vector = np.asarray(query_embedding[0], dtype=np.float32)
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector

    async def search(self, query: str, episode_id: str = None, limit: int = 3, client_openai = None) -> List[Dict[str, Any]]:
        """Searches index for similar chunks using hybrid TF-IDF + keyword scoring."""
        if not self.chunks or not self.vectors:
            return []

        query_vector = None
        if self.provider == "gemini" and client_openai:
            try:
                query_vector = await self._embed_query(query, client_openai)
            except Exception as e:
                logger.error(f"Gemini query embedding failed: {e}. Falling back to local TF-IDF query.")

        if query_vector is None:
            expanded_query = " ".join(expand_query_tokens(query))
            query_tokens = tokenize(expanded_query or query)
            query_vector = self.generate_tfidf_vector(query_tokens)

        candidates = []
        for idx, chunk in enumerate(self.chunks):
            if episode_id is None or chunk["episodeId"] == episode_id:
                candidates.append((idx, chunk))

        if not candidates:
            return []

        results = []

        if FAISS_AVAILABLE and self.provider == "gemini" and query_vector.shape[0] > 1 and self.vectors:
            try:
                dim = query_vector.shape[0]
                index = faiss.IndexFlatIP(dim)
                cand_vectors = np.vstack([self.vectors[idx] for idx, _ in candidates]).astype(np.float32)
                if cand_vectors.ndim == 1:
                    cand_vectors = cand_vectors.reshape(1, -1)
                faiss.normalize_L2(cand_vectors)
                index.add(cand_vectors)
                q_vec = query_vector.reshape(1, -1).astype(np.float32)
                faiss.normalize_L2(q_vec)
                search_lim = min(limit, len(candidates))
                similarities, indices = index.search(q_vec, search_lim)

                for sim, ind in zip(similarities[0], indices[0]):
                    if ind == -1:
                        continue
                    _, chunk = candidates[ind]
                    keyword_score = keyword_overlap_score(query, chunk["text"])
                    combined = float(sim) * 0.75 + keyword_score * 0.25
                    results.append({
                        "chunk": chunk,
                        "score": combined,
                        "timestamp": self.calculate_timestamp(chunk, chunk["episodeId"])
                    })
            except Exception as e:
                logger.error(f"FAISS search failed: {e}. Falling back to NumPy search.")
                results = []

        if not results:
            for idx, chunk in candidates:
                cand_vec = self.vectors[idx]
                if cand_vec.shape[0] != query_vector.shape[0]:
                    tfidf_score = 0.0
                else:
                    dot = np.dot(cand_vec, query_vector)
                    norm_a = np.linalg.norm(cand_vec)
                    norm_b = np.linalg.norm(query_vector)
                    tfidf_score = float(dot / (norm_a * norm_b)) if norm_a > 0 and norm_b > 0 else 0.0

                keyword_score = keyword_overlap_score(query, chunk["text"])
                combined = tfidf_score * 0.65 + keyword_score * 0.35

                results.append({
                    "chunk": chunk,
                    "score": combined,
                    "timestamp": self.calculate_timestamp(chunk, chunk["episodeId"])
                })

        results.sort(key=lambda x: x["score"], reverse=True)

        max_score = results[0]["score"] if results else 0.0
        if max_score < 0.08 and len(results) <= 4:
            return results

        return results[:limit]

    def get_episode_chunks(self, episode_id: str) -> List[Dict[str, Any]]:
        return [chunk for chunk in self.chunks if chunk["episodeId"] == episode_id]

    def calculate_timestamp(self, chunk: Dict[str, Any], episode_id: str) -> str:
        # We can't know the full duration without looking it up, but default to 30 mins
        # Standard helper is formatTime(seconds)
        start_ratio = chunk["metadata"]["startRatio"]
        end_ratio = chunk["metadata"]["endRatio"]
        avg_ratio = (start_ratio + end_ratio) / 2
        
        # Let's approximate duration as 1800s (30m) unless we can lookup. We'll map ratio back to time.
        total_seconds = 1800
        seconds = int(avg_ratio * total_seconds)
        min_val = seconds // 60
        sec_val = seconds % 60
        return f"{min_val:02d}:{sec_val:02d}"

    def save_index(self):
        """Saves current chunks and metadata to index files."""
        try:
            # Save chunks metadata, vocabulary, and config
            meta = {
                "provider": self.provider,
                "chunk_size": self.chunk_size,
                "chunk_overlap": self.chunk_overlap,
                "vocabulary": self.vocabulary,
                "idf": self.idf,
                "chunks": self.chunks
            }
            with open(self.index_file_path, 'w', encoding='utf-8') as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)
                
            # Save vectors
            if self.vectors:
                np.save(self.vectors_file_path, np.array(self.vectors, dtype=object), allow_pickle=True)
                
            logger.info("Saved FAISS/NumPy vector store index successfully.")
        except Exception as e:
            logger.error(f"Failed to save vector store index: {e}")

    def load_index(self):
        """Loads chunks and vectors from disk if available."""
        if not os.path.exists(self.index_file_path) or not os.path.exists(self.vectors_file_path):
            logger.info("No saved vector store index found. Starting fresh.")
            return
            
        try:
            with open(self.index_file_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)
                
            self.provider = meta.get("provider", self.provider)
            self.chunk_size = meta.get("chunk_size", self.chunk_size)
            self.chunk_overlap = meta.get("chunk_overlap", self.chunk_overlap)
            self.vocabulary = meta.get("vocabulary", [])
            self.idf = meta.get("idf", {})
            self.chunks = meta.get("chunks", [])
            
            # Load vectors
            vec_arr = np.load(self.vectors_file_path, allow_pickle=True)
            self.vectors = [v for v in vec_arr]
            
            logger.info(f"Loaded vector store index from disk: {len(self.chunks)} chunks.")
        except Exception as e:
            logger.error(f"Failed to load vector store index: {e}. Initializing empty.")
            self.chunks = []
            self.vectors = []

    def get_stats(self) -> Dict[str, Any]:
        episodes_indexed = list(set(c["episodeId"] for c in self.chunks))
        dims = self.vectors[0].shape[0] if self.vectors else 0
        return {
            "provider": self.provider,
            "totalChunks": len(self.chunks),
            "episodesCount": len(episodes_indexed),
            "dimensions": dims,
            "chunkSize": self.chunk_size,
            "chunkOverlap": self.chunk_overlap,
            "vocabularySize": len(self.vocabulary)
        }

    def clear(self):
        self.chunks = []
        self.vectors = []
        self.vocabulary = []
        self.idf = {}
        if os.path.exists(self.index_file_path):
            os.remove(self.index_file_path)
        if os.path.exists(self.vectors_file_path):
            os.remove(self.vectors_file_path)
        logger.info("Cleared Vector Store.")

# Singleton Instance
vector_store = FaissVectorStore()
