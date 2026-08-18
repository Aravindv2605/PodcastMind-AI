// In-memory Client-Side Vector Database (VectorStore)
// Supports document chunking, Local TF-IDF vectorization, Gemini Embeddings API, and Cosine Similarity.

const STOPWORDS = new Set([
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
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOPWORDS.has(token));
}

export class VectorStore {
  constructor(options = {}) {
    this.provider = options.provider || "local-tfidf"; // "local-tfidf" or "gemini"
    this.geminiApiKey = options.geminiApiKey || "";
    this.chunkSize = options.chunkSize || 3; // in sentences
    this.chunkOverlap = options.chunkOverlap || 1; // in sentences
    
    // Store array of: { id, episodeId, text, vector: number[], tokens: string[], metadata: {} }
    this.vectors = [];
    
    // Corpus vocabulary and IDFs for TF-IDF mode
    this.vocabulary = [];
    this.idf = {};
  }

  // Split text into chunks based on sentences
  chunkText(text, episodeId) {
    if (!text) return [];
    
    // Split into sentences (simple sentence parser)
    const sentences = text
      .replace(/([.?!])\s+/g, "$1|")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const chunks = [];
    let i = 0;
    
    while (i < sentences.length) {
      const chunkSentences = sentences.slice(i, i + this.chunkSize);
      if (chunkSentences.length === 0) break;

      const chunkText = chunkSentences.join(" ");
      
      // Calculate approximate timestamp context in the episode (spread evenly)
      const ratioStart = i / sentences.length;
      const ratioEnd = Math.min(1.0, (i + chunkSentences.length) / sentences.length);
      
      chunks.push({
        id: `chunk-${episodeId}-${i}`,
        episodeId,
        text: chunkText,
        metadata: {
          startRatio: ratioStart,
          endRatio: ratioEnd,
          sentenceIndex: i
        }
      });

      // Advance by chunkSize minus overlap
      const step = this.chunkSize - this.chunkOverlap;
      i += step > 0 ? step : 1;
    }

    return chunks;
  }

  // Update overall corpus vocabulary & IDFs for Local TF-IDF search
  rebuildTfidfVocabulary() {
    const docTokens = this.vectors.map(v => v.tokens || tokenize(v.text));
    const df = {};
    const vocabSet = new Set();

    docTokens.forEach(tokens => {
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach(token => {
        vocabSet.add(token);
        df[token] = (df[token] || 0) + 1;
      });
    });

    this.vocabulary = Array.from(vocabSet);
    const N = this.vectors.length;
    
    this.idf = {};
    this.vocabulary.forEach(token => {
      this.idf[token] = Math.log(1 + N / (df[token] || 1));
    });

    // Re-vectorize existing documents
    this.vectors.forEach((item, index) => {
      if (this.provider === "local-tfidf") {
        this.vectors[index].vector = this.generateTfidfVector(item.tokens || tokenize(item.text));
      }
    });
  }

  // Generate tfidf vector for a tokenized list
  generateTfidfVector(tokens) {
    const tf = {};
    tokens.forEach(token => {
      tf[token] = (tf[token] || 0) + 1;
    });

    const vector = this.vocabulary.map(token => {
      if (!tf[token]) return 0;
      const tfVal = tf[token] / tokens.length; // normalize term frequency
      const idfVal = this.idf[token] || 0;
      return tfVal * idfVal;
    });

    // Normalize vector (L2 norm)
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  }

  // Call Gemini Embeddings API
  async generateGeminiEmbedding(text) {
    if (!this.geminiApiKey) {
      throw new Error("Gemini API key is not configured.");
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text }] }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to generate Gemini embedding: ${response.status}`);
    }

    const data = await response.json();
    if (data.embedding && data.embedding.values) {
      return data.embedding.values;
    }
    throw new Error("Invalid response format from Gemini Embeddings API");
  }

  // Index document content
  async addEpisodeTranscript(episodeId, fullTranscript) {
    // 1. Remove existing chunks of this episode to avoid duplication
    this.vectors = this.vectors.filter(v => v.episodeId !== episodeId);

    // 2. Chunk text
    const chunks = this.chunkText(fullTranscript, episodeId);
    if (chunks.length === 0) return;

    // 3. Vectorize chunks
    if (this.provider === "gemini") {
      // Index in parallel batches
      const indexedChunks = [];
      const batchSize = 5;
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const promises = batch.map(async (chunk) => {
          try {
            const vector = await this.generateGeminiEmbedding(chunk.text);
            return {
              ...chunk,
              vector,
              tokens: tokenize(chunk.text)
            };
          } catch (err) {
            console.error(`Gemini embedding failed for chunk: ${chunk.text.substring(0, 30)}...`, err);
            // Fallback to TF-IDF vector temporarily if Gemini fails
            return null;
          }
        });
        
        const results = await Promise.all(promises);
        results.forEach(res => {
          if (res) indexedChunks.push(res);
        });
      }

      this.vectors.push(...indexedChunks);
    } else {
      // Local TF-IDF mode
      const items = chunks.map(chunk => ({
        ...chunk,
        tokens: tokenize(chunk.text),
        vector: [] // Will fill after vocabulary rebuild
      }));
      
      this.vectors.push(...items);
      this.rebuildTfidfVocabulary();
    }
  }

  // Core Cosine Similarity Search
  async search(queryText, options = {}) {
    const episodeId = options.episodeId || null;
    const limit = options.limit || 3;
    const threshold = options.threshold || 0.0;
    
    if (this.vectors.length === 0) return [];

    let queryVector;
    
    if (this.provider === "gemini") {
      try {
        queryVector = await this.generateGeminiEmbedding(queryText);
      } catch (err) {
        console.warn("Gemini query embedding failed, falling back to local TF-IDF search:", err);
        // Temporary fallback
        const queryTokens = tokenize(queryText);
        const localStore = new VectorStore({ provider: "local-tfidf" });
        localStore.vectors = this.vectors.map(v => ({ ...v, tokens: v.tokens || tokenize(v.text) }));
        localStore.rebuildTfidfVocabulary();
        return localStore.search(queryText, { episodeId, limit, threshold });
      }
    } else {
      const queryTokens = tokenize(queryText);
      queryVector = this.generateTfidfVector(queryTokens);
    }

    // Filter by episode if requested
    const candidates = episodeId
      ? this.vectors.filter(v => v.episodeId === episodeId)
      : this.vectors;

    if (candidates.length === 0) return [];

    // Calculate Cosine Similarity
    const results = candidates.map(item => {
      let score = 0;
      
      if (item.vector && item.vector.length > 0 && queryVector && queryVector.length > 0) {
        // If dimensions don't match, we can't dot product
        const len = Math.min(item.vector.length, queryVector.length);
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < len; i++) {
          dotProduct += item.vector[i] * queryVector[i];
          normA += item.vector[i] * item.vector[i];
          normB += queryVector[i] * queryVector[i];
        }

        if (normA > 0 && normB > 0) {
          score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        }
      } else {
        // Fallback simple overlap score
        const queryTokensSet = new Set(tokenize(queryText));
        const itemTokens = item.tokens || tokenize(item.text);
        const intersect = itemTokens.filter(t => queryTokensSet.has(t));
        score = intersect.length / Math.max(1, queryTokensSet.size);
      }

      return {
        chunk: item,
        score: parseFloat(score.toFixed(4))
      };
    });

    // Sort, filter by threshold and limit
    return results
      .filter(r => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Clear all vectors
  clear() {
    this.vectors = [];
    this.vocabulary = [];
    this.idf = {};
  }

  // Get index metrics and configurations
  getStats() {
    const totalChunks = this.vectors.length;
    const episodesIndexed = Array.from(new Set(this.vectors.map(v => v.episodeId)));
    
    let dimensions = 0;
    if (totalChunks > 0 && this.vectors[0].vector) {
      dimensions = this.vectors[0].vector.length;
    }

    return {
      provider: this.provider,
      totalChunks,
      episodesCount: episodesIndexed.length,
      dimensions,
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      vocabularySize: this.vocabulary.length
    };
  }
}
