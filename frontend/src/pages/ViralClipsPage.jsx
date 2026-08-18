import React, { useState } from "react";
import { usePodcast } from "../context/PodcastContext";
import { motion } from "framer-motion";
import { Film, Play, Sparkles, AlertCircle, Share2, HelpCircle } from "lucide-react";
import ReelModal from "../components/ReelModal";

export default function ViralClipsPage() {
  const { activeEpisode, viralClips, showToast } = usePodcast();
  const [selectedClip, setSelectedClip] = useState(null);

  const clips = viralClips[activeEpisode.id] || [];

  const getScoreColorClass = (score) => {
    if (score >= 90) return "bg-success/10 border-success/30 text-success shadow-neon-green";
    if (score >= 70) return "bg-warning/10 border-warning/30 text-warning";
    return "bg-red-500/10 border-red-500/30 text-red-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto lg:ml-64 ml-0 min-h-screen"
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2">
            <span>🔥 AI Viral Clips Detector</span>
          </h2>
          <p className="text-xs text-text-muted mt-1 font-medium">
            AI automatically slices and identifies high-retention clips optimized for TikTok, Reels, and YouTube Shorts
          </p>
        </div>
      </div>

      {/* Grid container */}
      {clips.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-text-muted max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-primary mx-auto mb-2" />
          <h4 className="text-xs font-bold text-white">No Clips Found</h4>
          <p className="text-[10px] text-text-muted mt-1">Upload a show or switch the active podcast to generate clips.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clips.map((clip) => (
            <div
              key={clip.id}
              className="glass-card overflow-hidden border border-white/5 flex flex-col justify-between group hover:border-primary/20 transition-all duration-300"
            >
              {/* Image Preview pane */}
              <div className="relative h-44 overflow-hidden shrink-0">
                <img
                  src={clip.thumbnail}
                  alt="Clip Art"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <button 
                    onClick={() => setSelectedClip(clip)}
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:scale-110 active:scale-95 transition-all border border-white/10"
                  >
                    <Play className="w-5 h-5 fill-white translate-x-0.5" />
                  </button>
                </div>

                {/* Left indicators */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-black/75 text-white">
                    Start: {clip.startTime}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary text-white">
                    {clip.emotion}
                  </span>
                </div>

                {/* Score badge top right */}
                <span className={`absolute top-4 right-4 text-[9px] font-bold px-2.5 py-1 rounded-full border ${getScoreColorClass(clip.viralScore)}`}>
                  Viral Score: {clip.viralScore}%
                </span>
              </div>

              {/* Text Description and quote */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Key Highlight Quote</span>
                  <p className="text-xs leading-relaxed text-slate-200 font-medium italic">
                    "{clip.quote}"
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedClip(clip)}
                    className="flex-1 font-heading font-bold text-[11px] py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-neon-purple"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Generate Reel</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`https://podcastmind.ai/clip/${clip.id}`);
                      showToast("Viral clip share link copied to clipboard!");
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-text-muted hover:text-white transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Reel creation modal display */}
      {selectedClip && (
        <ReelModal
          clip={selectedClip}
          onClose={() => setSelectedClip(null)}
        />
      )}
    </motion.div>
  );
}
