import React, { useState } from "react";
import { usePodcast } from "../context/PodcastContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Layers, Columns, Grid, RefreshCw } from "lucide-react";

export default function MultiverseViewPage() {
  const { episodes, activeEpisode, selectEpisode, perspectives } = usePodcast();
  const [viewMode, setViewMode] = useState("all"); // 'all' | 'compare'
  
  // Local compare modes (default: beginner & expert)
  const [compareL, setCompareL] = useState("beginner");
  const [compareR, setCompareR] = useState("expert");

  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);

  const activePerspectives = perspectives[activeEpisode.id] || perspectives["e1"];

  const handleGenerate = () => {
    setGenerating(true);
    setGenProgress(0);
    const interval = setInterval(() => {
      setGenProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setGenerating(false);
            alert("All perspectives compiled and optimized via AI!");
          }, 300);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  const getEmoji = (key) => {
    if (key === "beginner") return "😊";
    if (key === "founder") return "🚀";
    if (key === "expert") return "🧠";
    return "⚖️";
  };

  const getTitle = (key) => {
    if (key === "beginner") return "Beginner Mode";
    if (key === "founder") return "Founder Mode";
    if (key === "expert") return "Expert Mode";
    return "Critical Mode";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto lg:ml-64 ml-0 min-h-screen"
    >
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-white/5 gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2">
            <span>🌐 Multiverse View Perspective Engine</span>
          </h2>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Explore the transcript translated through distinct professional and cognitive lenses
          </p>
        </div>

        {/* Episode Selector dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Select Episode</label>
          <select
            value={activeEpisode.id}
            onChange={(e) => {
              const selected = episodes.find((ep) => ep.id === e.target.value);
              if (selected) selectEpisode(selected);
            }}
            className="text-xs font-bold py-2.5 px-4 rounded-xl bg-[#13131A] border border-white/5 text-white outline-none focus:border-primary/40 cursor-pointer"
          >
            {episodes.map((ep) => (
              <option key={ep.id} value={ep.id}>
                {ep.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Options Row: Layout selection and Generate */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-1">
        {/* Compare vs All Tab Buttons */}
        <div className="flex bg-[#13131A] rounded-xl p-0.5 border border-white/5 shrink-0">
          <button
            onClick={() => setViewMode("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "all" ? "bg-primary text-white" : "text-text-muted hover:text-white"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>All Perspectives</span>
          </button>
          <button
            onClick={() => setViewMode("compare")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "compare" ? "bg-primary text-white" : "text-text-muted hover:text-white"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Compare 2 Perspectives</span>
          </button>
        </div>

        {/* Generate Perspectives Button */}
        <div className="w-full sm:w-auto">
          {generating ? (
            <div className="space-y-1.5 w-60">
              <div className="flex justify-between text-[10px] font-semibold text-text-muted">
                <span>Translating layers...</span>
                <span>{genProgress}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${genProgress}%` }} />
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer hover:border-white/10 hover:text-primary"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate All Perspectives</span>
            </button>
          )}
        </div>
      </div>

      {/* View Mode workspaces */}
      <AnimatePresence mode="wait">
        
        {/* View Mode A: ALL 4 PERSPECTIVES GRID */}
        {viewMode === "all" && (
          <motion.div
            key="all-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {Object.keys(activePerspectives).map((key) => {
              const p = activePerspectives[key];
              const isFounder = key === "founder";

              return (
                <div
                  key={key}
                  className={`glass-card p-5 border flex flex-col justify-between transition-all duration-300 ${
                    isFounder 
                      ? "border-primary/30 bg-primary/[0.02] shadow-neon-purple" 
                      : "border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{p.emoji}</span>
                      <div>
                        <h3 className="text-xs font-heading font-extrabold text-white">{p.title}</h3>
                        <p className="text-[9px] text-text-muted mt-0.5 font-semibold leading-none">{p.tagline}</p>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
                      {p.summary}
                    </p>

                    {/* Bullets */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Key Lenses</span>
                      {p.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex gap-2 items-start">
                          <span className="text-primary text-[10px] mt-0.5 shrink-0">•</span>
                          <p className="text-[10px] leading-relaxed text-slate-300 font-medium">{b}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlights Insight */}
                  <div className="mt-5 pt-3.5 border-t border-white/5 bg-white/[0.01] p-2.5 rounded-xl border border-white/5">
                    <span className="text-[9px] font-bold text-primary uppercase block mb-1">Perspective Insight</span>
                    <p className="text-[10px] leading-normal text-white font-semibold">
                      {p.insight}
                    </p>
                  </div>

                </div>
              );
            })}
          </motion.div>
        )}

        {/* View Mode B: COMPARE 2 PERSPECTIVES SIDE-BY-SIDE */}
        {viewMode === "compare" && (
          <motion.div
            key="compare-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* LEFT COMPARATOR PANE */}
            <div className="glass-card p-6 border border-white/5 space-y-5 flex flex-col justify-between min-h-[450px]">
              <div className="space-y-4">
                {/* Selector */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-lg">{getEmoji(compareL)}</span>
                    <span>{getTitle(compareL)}</span>
                  </span>
                  
                  <select
                    value={compareL}
                    onChange={(e) => setCompareL(e.target.value)}
                    className="text-[10px] font-bold py-1.5 px-3 rounded-lg bg-[#1D1D26] border border-white/5 text-white outline-none cursor-pointer"
                  >
                    <option value="beginner">Beginner Mode</option>
                    <option value="founder">Founder Mode</option>
                    <option value="expert">Expert Mode</option>
                    <option value="critical">Critical Mode</option>
                  </select>
                </div>

                {/* Content */}
                <p className="text-xs leading-relaxed text-slate-200 font-medium">
                  {activePerspectives[compareL].summary}
                </p>

                {/* Bullets */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  {activePerspectives[compareL].bullets.map((b, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="text-primary text-[10px] mt-0.5 shrink-0">•</span>
                      <p className="text-xs leading-relaxed text-slate-300 font-medium">{b}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Insight */}
              <div className="pt-3.5 border-t border-white/5 bg-white/[0.01] p-3.5 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold text-primary uppercase block mb-1">Key Insight</span>
                <p className="text-xs leading-normal text-white font-semibold">
                  {activePerspectives[compareL].insight}
                </p>
              </div>
            </div>

            {/* RIGHT COMPARATOR PANE */}
            <div className="glass-card p-6 border border-white/5 space-y-5 flex flex-col justify-between min-h-[450px]">
              <div className="space-y-4">
                {/* Selector */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-lg">{getEmoji(compareR)}</span>
                    <span>{getTitle(compareR)}</span>
                  </span>
                  
                  <select
                    value={compareR}
                    onChange={(e) => setCompareR(e.target.value)}
                    className="text-[10px] font-bold py-1.5 px-3 rounded-lg bg-[#1D1D26] border border-white/5 text-white outline-none cursor-pointer"
                  >
                    <option value="beginner">Beginner Mode</option>
                    <option value="founder">Founder Mode</option>
                    <option value="expert">Expert Mode</option>
                    <option value="critical">Critical Mode</option>
                  </select>
                </div>

                {/* Content */}
                <p className="text-xs leading-relaxed text-slate-200 font-medium">
                  {activePerspectives[compareR].summary}
                </p>

                {/* Bullets */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  {activePerspectives[compareR].bullets.map((b, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="text-secondary text-[10px] mt-0.5 shrink-0">•</span>
                      <p className="text-xs leading-relaxed text-slate-300 font-medium">{b}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Insight */}
              <div className="pt-3.5 border-t border-white/5 bg-white/[0.01] p-3.5 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold text-secondary uppercase block mb-1">Key Insight</span>
                <p className="text-xs leading-normal text-white font-semibold">
                  {activePerspectives[compareR].insight}
                </p>
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
