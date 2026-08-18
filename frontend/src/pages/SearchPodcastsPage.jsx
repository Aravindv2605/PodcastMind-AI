import React, { useState } from "react";
import { usePodcast } from "../context/PodcastContext";
import { motion } from "framer-motion";
import { Search, Compass, Calendar, Heart, Share2, Play, BarChart3, Radio, Sparkles, Filter, X } from "lucide-react";

export default function SearchPodcastsPage() {
  const { podcasts, selectPodcast, setActivePage, searchQuery, setSearchQuery } = usePodcast();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Business", "Diet", "Motivation", "Story", "Yoga"];

  // Filter for podcasts uploaded by others
  const publicPodcasts = podcasts.filter((pod) => !pod.isUserUploaded);

  // Apply search query and category filters
  const filteredPodcasts = publicPodcasts.filter((pod) => {
    // 1. Category check
    const matchesCategory =
      selectedCategory === "All" ||
      pod.category.toLowerCase() === selectedCategory.toLowerCase();

    // 2. Search text check
    const matchesSearch =
      !searchQuery.trim() ||
      pod.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      pod.host.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      pod.category.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      pod.description.toLowerCase().includes(searchQuery.toLowerCase().trim());

    return matchesCategory && matchesSearch;
  });

  const handleAnalyzeClick = (pod) => {
    selectPodcast(pod);
    setActivePage("dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto lg:ml-64 ml-0 min-h-screen"
    >
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            <span>Search Podcasts</span>
          </h2>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Browse and search original podcast archives uploaded by other creators on the network
          </p>
        </div>

        {/* Categories Tab selector */}
        <div className="flex flex-wrap gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary/10 border-primary text-primary shadow-neon-purple"
                  : "bg-[#13131A] border-white/5 text-text-muted hover:text-white hover:border-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main search card container */}
      <div className="w-full relative group">
        <Search className="w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors absolute left-4.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by title, creator, domain category, description details..."
          className="w-full text-xs md:text-sm py-3.5 pl-12.5 pr-12 rounded-2xl bg-[#13131A] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all focus:ring-1 focus:ring-primary/20"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results grid */}
      {filteredPodcasts.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center text-center p-16 border border-white/5 max-w-2xl mx-auto mt-12 rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-white/5 text-text-muted flex items-center justify-center">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Podcasts Match Your Search</h3>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              We couldn't find any public podcasts matching "{searchQuery}" under the category "{selectedCategory}". Try modifying your search filters or resetting keywords.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="text-xs font-semibold py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPodcasts.map((pod) => (
            <div
              key={pod.id}
              className="glass-card overflow-hidden border border-white/5 flex flex-col justify-between group hover:border-primary/20 transition-all duration-300"
            >
              {/* Image Header overlay */}
              <div className="relative h-48 overflow-hidden shrink-0">
                <img
                  src={pod.thumbnail}
                  alt={pod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-black/10" />

                {/* Category Tag */}
                <span className="absolute top-4 left-4 text-[9px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                  {pod.category}
                </span>

                {/* Upload Date */}
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-[10px] text-slate-300 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <span>Release: {pod.uploadDate}</span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight group-hover:text-primary transition-colors leading-snug line-clamp-1">
                    {pod.title}
                  </h3>
                  <p className="text-[11px] text-text-muted mt-1.5 font-semibold">
                    Host: {pod.host} • {pod.episodesCount} Episodes
                  </p>
                  <p className="text-[11px] text-text-muted/80 mt-2.5 leading-relaxed line-clamp-2">
                    {pod.description}
                  </p>
                </div>

                {/* Stats & Click Actions */}
                <div className="mt-5 pt-4 border-t border-white/5">
                  {/* Stats values */}
                  <div className="flex items-center justify-between text-[10px] font-bold text-text-muted mb-4 px-1">
                    <span className="flex items-center gap-1">
                      <Play className="w-3.5 h-3.5 fill-text-muted/10 text-text-muted" />
                      <span>{pod.plays} Listens</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-text-muted" />
                      <span>{pod.likes} Likes</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-text-muted" />
                      <span>{pod.shares} Shares</span>
                    </span>
                  </div>

                  {/* Play & Detail Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAnalyzeClick(pod)}
                      className="py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-[10px] flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-neon-purple"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Analyze & Play</span>
                    </button>
                    <button 
                      onClick={() => handleAnalyzeClick(pod)}
                      className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>AI Insights</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
