import React, { useState, useEffect } from "react";
import { usePodcast } from "../context/PodcastContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, 
  Search, 
  Settings, 
  RefreshCw, 
  Activity, 
  Cpu, 
  Layers, 
  Sparkles, 
  Clock, 
  Sliders, 
  Info,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function VectorDbPage() {
  const { 
    episodes,
    podcasts,
    vectorDbSettings, 
    setVectorDbSettings, 
    vectorDbStats, 
    isVectorIndexing, 
    rebuildVectorIndex,
    vectorStoreRef,
    showToast
  } = usePodcast();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchEpisodeId, setSearchEpisodeId] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  // Settings form states
  const [provider, setProvider] = useState(vectorDbSettings.provider);
  const [chunkSize, setChunkSize] = useState(vectorDbSettings.chunkSize);
  const [chunkOverlap, setChunkOverlap] = useState(vectorDbSettings.chunkOverlap);

  // Re-sync form settings with context
  useEffect(() => {
    setProvider(vectorDbSettings.provider);
    setChunkSize(vectorDbSettings.chunkSize);
    setChunkOverlap(vectorDbSettings.chunkOverlap);
  }, [vectorDbSettings]);

  // Run a default search on launch if query is empty just to show some vectors
  useEffect(() => {
    handleSearch(null, "AI Revolution");
  }, [vectorDbStats]);

  const handleSearch = async (e, overrideQuery = null) => {
    if (e) e.preventDefault();
    const query = overrideQuery !== null ? overrideQuery : searchQuery;
    if (!query.trim() || !vectorStoreRef.current) return;

    setIsSearching(true);
    try {
      const results = await vectorStoreRef.current.search(query, {
        episodeId: searchEpisodeId === "all" ? null : searchEpisodeId,
        limit: 5
      });
      setSearchResults(results);
      if (results.length > 0) {
        setSelectedResult(results[0]);
      } else {
        setSelectedResult(null);
      }
    } catch (err) {
      console.error("Vector search failed:", err);
      showToast("Vector search failed: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const newSettings = { provider, chunkSize: parseInt(chunkSize), chunkOverlap: parseInt(chunkOverlap) };
    setVectorDbSettings(newSettings);
    await rebuildVectorIndex(newSettings);
  };

  // Helper to find episode and podcast info for a chunk
  const getChunkSourceInfo = (episodeId) => {
    const ep = episodes.find(e => e.id === episodeId);
    if (!ep) return { episodeTitle: "Unknown Episode", podcastTitle: "Unknown Podcast", thumbnail: "" };
    const pod = podcasts.find(p => p.id === ep.podcastId);
    return {
      episodeTitle: ep.title,
      podcastTitle: pod ? pod.title : "Podcast",
      thumbnail: ep.thumbnail
    };
  };

  // Render a futuristic 8x16 (128 dimensions) vector heatmap representation
  const renderVectorHeatmap = (vector) => {
    if (!vector || vector.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/[0.01] border border-white/5 rounded-2xl h-48">
          <AlertCircle className="w-8 h-8 text-text-muted mb-2" />
          <span className="text-[11px] text-text-muted">No embedding vector values available for this chunk.</span>
        </div>
      );
    }

    // Limit to first 128 elements
    const sliceLen = Math.min(128, vector.length);
    const vectorSlice = vector.slice(0, sliceLen);
    
    // Find min and max for scaling colors
    let min = Math.min(...vectorSlice);
    let max = Math.max(...vectorSlice);
    if (min === max) { min = 0; max = 1; }

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] text-text-muted">
          <span>Vector Embedding Space Heatmap (First 128 of {vector.length} dims)</span>
          <span className="font-mono">Min: {min.toFixed(4)} | Max: {max.toFixed(4)}</span>
        </div>
        
        {/* Heatmap Grid */}
        <div className="grid grid-cols-16 gap-1 p-2 bg-white/[0.01] border border-white/5 rounded-2xl">
          {vectorSlice.map((val, idx) => {
            // Scale value to 0..1
            const normalized = (val - min) / (max - min);
            
            // Generate style color using HSL (0 = Deep Indigo/Blue, 1 = Hot Magenta/Pink)
            const hue = 260 + (normalized * 80); // shift hue
            const lightness = 10 + (normalized * 50); // shift lightness
            const color = `hsl(${hue}, 90%, ${lightness}%)`;
            const shadow = normalized > 0.85 ? `0 0 8px hsl(${hue}, 90%, 60%)` : "none";

            return (
              <div
                key={idx}
                style={{ backgroundColor: color, boxShadow: shadow }}
                className="w-full aspect-square rounded-md transition-all duration-300 hover:scale-125 cursor-pointer relative group"
                title={`Dim ${idx}: ${val.toFixed(6)}`}
              >
                {/* Micro tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 bg-background border border-white/10 px-2 py-1 rounded text-[8px] font-mono whitespace-nowrap text-white">
                  d[{idx}]: {val.toFixed(4)}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex gap-4 items-center justify-center text-[9px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[hsl(260,90%,15%)] border border-white/5" />
            <span>Low Activation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[hsl(300,90%,40%)] border border-white/5 shadow-sm shadow-secondary" />
            <span>Medium Activation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[hsl(340,90%,60%)] border border-white/5 shadow shadow-primary" />
            <span>High Activation</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 md:p-8 max-w-[1600px] mx-auto lg:ml-64 ml-0 space-y-6"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-[#13131A] via-[#101015] to-[#0A0A0C] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/15 transition-all duration-300" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/20 uppercase tracking-wider">
              Semantic Search Engine
            </span>
          </div>
          <h2 className="text-xl font-heading font-extrabold text-white">Vector Database Explorer</h2>
          <p className="text-xs text-text-muted leading-relaxed max-w-xl">
            Inspect indexed text chunks, run manual cosine-similarity searches, visualize embedding activations, and tune chunk settings.
          </p>
        </div>

        {/* Index Rebuild Button */}
        <button
          onClick={() => rebuildVectorIndex()}
          disabled={isVectorIndexing}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/5 hover:border-white/10 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 self-start md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-secondary ${isVectorIndexing ? "animate-spin" : ""}`} />
          <span>{isVectorIndexing ? "Indexing transcripts..." : "Rebuild Entire Index"}</span>
        </button>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-[#13131A] border border-white/5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted block font-medium">Embedding Provider</span>
            <span className="text-xs font-bold text-white mt-0.5 block capitalize">
              {vectorDbStats ? (vectorDbStats.provider === "gemini" ? "Gemini text-embedding" : "Local TF-IDF Vectorizer") : "Loading..."}
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-[#13131A] border border-white/5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-secondary/10 text-secondary shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted block font-medium">Vector Dimension</span>
            <span className="text-xs font-bold text-white mt-0.5 block font-mono">
              {vectorDbStats ? `${vectorDbStats.dimensions} dims` : "0 dims"}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl bg-[#13131A] border border-white/5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-500 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted block font-medium">Total Indexed Chunks</span>
            <span className="text-xs font-bold text-white mt-0.5 block">
              {vectorDbStats ? `${vectorDbStats.totalChunks} vectors` : "0 vectors"}
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-[#13131A] border border-white/5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-500 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted block font-medium">Distance Metric</span>
            <span className="text-xs font-bold text-white mt-0.5 block">
              Cosine Similarity
            </span>
          </div>
        </div>
      </div>

      {/* Main Panel Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Search & Heatmap (2/3 width) */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Query Debugger Card */}
          <div className="p-6 rounded-3xl bg-[#13131A] border border-white/5 space-y-5 shadow-xl">
            <div className="pb-3 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  <span>RAG Semantic Query Debugger</span>
                </h3>
                <p className="text-[10.5px] text-text-muted mt-0.5">
                  Type a concept to run a similarity check and retrieve matched transcript segments.
                </p>
              </div>
            </div>

            {/* Search inputs bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter semantic query (e.g., bricklaying robots, dating economics)..."
                  className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={searchEpisodeId}
                  onChange={(e) => setSearchEpisodeId(e.target.value)}
                  className="text-xs px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-slate-200 outline-none max-w-[150px]"
                >
                  <option value="all" className="bg-[#13131A]">All Episodes</option>
                  {episodes.map(ep => (
                    <option key={ep.id} value={ep.id} className="bg-[#13131A]">{ep.title.substring(0, 20)}...</option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95 shadow-neon-purple shrink-0"
                >
                  {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* Results Grid */}
            <div className="space-y-4">
              <h4 className="text-[10.5px] font-bold text-white uppercase tracking-wider">Retrieval Hits</h4>
              
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-white/5 border-dashed rounded-2xl bg-white/[0.005]">
                  <Database className="w-8 h-8 text-text-muted mb-2 animate-pulse" />
                  <p className="text-xs text-text-muted font-medium">No vectors retrieved.</p>
                  <p className="text-[10px] text-text-muted mt-1">Rebuild the index or try a different search phrase.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((res, index) => {
                    const isSelected = selectedResult && selectedResult.chunk.id === res.chunk.id;
                    const srcInfo = getChunkSourceInfo(res.chunk.episodeId);
                    
                    return (
                      <div
                        key={res.chunk.id}
                        onClick={() => setSelectedResult(res)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 ${
                          isSelected 
                            ? "bg-primary/10 border-primary shadow-neon-purple" 
                            : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                        }`}
                      >
                        {/* Rank Circle */}
                        <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0 self-center">
                          #{index + 1}
                        </div>

                        {/* Chunk Info */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[10px] font-bold text-white truncate max-w-[65%]">
                              {srcInfo.episodeTitle}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                              res.score > 0.6 ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            }`}>
                              Cosine Sim: {(res.score * 100).toFixed(1)}%
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
                            "{res.chunk.text}"
                          </p>

                          <div className="flex items-center gap-2 text-[9px] text-text-muted">
                            <span className="font-bold text-primary">{srcInfo.podcastTitle}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-text-muted" />
                              Approx Timestamp: {res.timestamp || "00:00"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Vector Inspector Heatmap Display */}
          {selectedResult && (
            <div className="p-6 rounded-3xl bg-[#13131A] border border-white/5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div>
                  <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    <span>Vector Dimension Activation Inspector</span>
                  </h3>
                  <p className="text-[10.5px] text-text-muted mt-0.5">
                    Analyzing internal float weights for chunk: <span className="font-mono text-white">{selectedResult.chunk.id}</span>
                  </p>
                </div>
              </div>

              {renderVectorHeatmap(selectedResult.chunk.vector)}
            </div>
          )}
        </div>

        {/* Right Column: Settings & Database Metrics (1/3 width) */}
        <div className="w-full lg:w-96 shrink-0 space-y-6">
          {/* Settings Card */}
          <div className="p-6 rounded-3xl bg-[#13131A] border border-white/5 space-y-5 shadow-xl">
            <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2 pb-3 border-b border-white/5">
              <Settings className="w-4.5 h-4.5 text-primary" />
              <span>Vector Database Config</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Provider Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Embeddings Engine</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider("local-tfidf")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      provider === "local-tfidf"
                        ? "bg-primary/10 border-primary text-white"
                        : "bg-white/[0.01] border-white/5 text-text-muted hover:border-white/10"
                    }`}
                  >
                    Local TF-IDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("gemini")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      provider === "gemini"
                        ? "bg-primary/10 border-primary text-white"
                        : "bg-white/[0.01] border-white/5 text-text-muted hover:border-white/10"
                    }`}
                  >
                    Gemini API
                  </button>
                </div>
              </div>

              {/* Chunk Size sentences */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Chunk Size</label>
                  <span className="text-xs text-white font-mono font-bold">{chunkSize} sentences</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(e.target.value)}
                  className="w-full accent-primary bg-white/5 h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* Chunk Overlap sentences */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Chunk Overlap</label>
                  <span className="text-xs text-white font-mono font-bold">{chunkOverlap} sentences</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(e.target.value)}
                  className="w-full accent-primary bg-white/5 h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* Info alert */}
              <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex gap-2 text-[10px] text-text-muted leading-relaxed">
                <Info className="w-4.5 h-4.5 text-primary shrink-0" />
                <span>
                  Adjusting these values requires a full index rebuild to partition documents into new overlap structures.
                </span>
              </div>

              {/* Rebuild & Save button */}
              <button
                type="submit"
                disabled={isVectorIndexing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs transition-all cursor-pointer shadow-neon-purple hover:opacity-95 flex items-center justify-center gap-2"
              >
                {isVectorIndexing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sliders className="w-3.5 h-3.5" />
                )}
                <span>Save & Rebuild Index</span>
              </button>
            </form>
          </div>

          {/* Database Coverage Status */}
          <div className="p-6 rounded-3xl bg-[#13131A] border border-white/5 space-y-4 shadow-xl">
            <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2 pb-2 border-b border-white/5">
              <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
              <span>Index Coverage</span>
            </h3>

            <div className="space-y-4">
              {episodes.map(ep => {
                const chunksCount = vectorDbStats && vectorStoreRef.current
                  ? vectorStoreRef.current.vectors.filter(v => v.episodeId === ep.id).length
                  : 0;

                return (
                  <div key={ep.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <span className="font-bold text-white truncate block">{ep.title}</span>
                      <span className="text-[10px] text-text-muted">{ep.host}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        {chunksCount} chunks
                      </span>
                      {chunksCount > 0 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-text-muted" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
