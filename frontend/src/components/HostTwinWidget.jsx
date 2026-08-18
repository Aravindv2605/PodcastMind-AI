import React from "react";
import { usePodcast } from "../context/PodcastContext";
import { Sparkles, MessageSquare, Bot } from "lucide-react";

export default function HostTwinWidget() {
  const { setActivePage } = usePodcast();

  return (
    <div className="glass-card p-4 border border-white/5 relative overflow-hidden group flex items-center justify-between gap-4 h-[90px]">
      {/* Background glow effects */}
      <div className="absolute -left-12 -top-12 w-24 h-24 rounded-full bg-secondary/15 blur-xl group-hover:bg-secondary/20 transition-all duration-300 pointer-events-none" />
      <div className="absolute -right-12 -bottom-12 w-24 h-24 rounded-full bg-primary/15 blur-xl group-hover:bg-primary/20 transition-all duration-300 pointer-events-none" />

      {/* Avatar details */}
      <div className="flex items-center gap-3 relative">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary to-secondary p-[1px] shrink-0 shadow-lg">
          <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center relative overflow-hidden">
            {/* Glowing Face mesh representation */}
            <svg className="w-8 h-8 text-secondary pulse-glow" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50,15 C35,15 25,25 25,45 C25,65 35,80 50,85 C65,80 75,65 75,45 C75,25 65,15 50,15 Z" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
              <circle cx="50" cy="40" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M35,45 Q50,30 65,45" stroke="#7B5EFF" strokeWidth="1.5" />
              <circle cx="42" cy="40" r="2.5" fill="#00E5A0" />
              <circle cx="58" cy="40" r="2.5" fill="#00E5A0" />
              <circle cx="50" cy="65" r="3" fill="#FF5E9C" />
            </svg>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-white tracking-wide">AI Host Twin</h4>
            <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-primary/20 text-primary uppercase">PRO</span>
          </div>
          <p className="text-[10px] text-text-muted font-medium">
            Talk with your AI Podcast Host
          </p>
        </div>
      </div>

      {/* Action Start Chat button */}
      <button
        onClick={() => setActivePage("ai-host-twin")}
        className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-neon-purple shrink-0 relative"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>Start Chat</span>
      </button>
    </div>
  );
}
