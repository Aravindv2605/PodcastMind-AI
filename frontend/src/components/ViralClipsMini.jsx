import React, { useState } from "react";
import { usePodcast } from "../context/PodcastContext";
import { Film, Play, Sparkles } from "lucide-react";
import ReelModal from "./ReelModal";

export default function ViralClipsMini() {
  const { activeEpisode, viralClips, setActivePage } = usePodcast();
  const [selectedClip, setSelectedClip] = useState(null);

  const clips = viralClips[activeEpisode.id] || [];
  // Take top 2
  const topClips = clips.slice(0, 2);

  return (
    <div className="glass-card p-5 border border-white/5 flex flex-col h-[280px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-orange-500">🔥</span>
          <h3 className="text-sm font-heading font-bold text-white">Viral Clips</h3>
        </div>
        <button 
          onClick={() => setActivePage("viral-clips")}
          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Grid List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-none">
        {topClips.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-text-muted">
            No clips detected for this episode.
          </div>
        ) : (
          topClips.map((clip) => (
            <div 
              key={clip.id} 
              className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-all flex gap-3 relative overflow-hidden group"
            >
              {/* Thumbnail preview */}
              <div className="w-20 h-20 rounded-xl overflow-hidden relative shrink-0">
                <img 
                  src={clip.thumbnail} 
                  alt="Clip Art" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                    <Play className="w-2.5 h-2.5 fill-white translate-x-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-1 right-1 text-[8px] font-bold px-1 rounded bg-black/75 text-white">
                  {clip.startTime}
                </span>
              </div>

              {/* Quote details */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <p className="text-[10.5px] font-medium leading-relaxed text-slate-200 line-clamp-2">
                  "{clip.quote}"
                </p>
                <div className="flex items-center justify-between gap-1.5 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-success/15 text-success">
                      Score: {clip.viralScore}%
                    </span>
                    <span className="text-[9px] text-text-muted">
                      {clip.emotion}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedClip(clip)}
                    className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-[9px] transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
                  >
                    Generate Reel
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Exporter Popup Trigger */}
      {selectedClip && (
        <ReelModal 
          clip={selectedClip} 
          onClose={() => setSelectedClip(null)} 
        />
      )}
    </div>
  );
}
