import React from "react";
import { usePodcast } from "../context/PodcastContext";
import { ChevronRight, ArrowRight, Sparkles } from "lucide-react";

export default function MultiverseMini() {
  const { setActivePage, setCompareModes } = usePodcast();

  const modes = [
    { key: "beginner", emoji: "😊", title: "Beginner Mode", desc: "Simple explanations & key basics" },
    { key: "founder", emoji: "🚀", title: "Founder Mode", desc: "Business impact & startup insights", active: true },
    { key: "expert", emoji: "🧠", title: "Expert Mode", desc: "Deep technical analysis" },
    { key: "critical", emoji: "⚖️", title: "Critical Mode", desc: "Balanced analysis & different opinions" }
  ];

  const handleModeClick = (key) => {
    // Seed compare mode with this key and a secondary key
    const secondary = key === "beginner" ? "expert" : "beginner";
    setCompareModes([key, secondary]);
    setActivePage("multiverse-view");
  };

  return (
    <div className="glass-card p-5 border border-white/5 flex flex-col h-[280px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-1 shrink-0">
        <h3 className="text-sm font-heading font-bold text-white flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Multiverse View</span>
        </h3>
        <button 
          onClick={() => setActivePage("multiverse-view")}
          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <span>View All</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <p className="text-[10px] text-text-muted mb-3 font-medium shrink-0">
        Choose a perspective to explore this podcast
      </p>

      {/* Modes Grid list */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-none">
        {modes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => handleModeClick(mode.key)}
            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
              mode.active
                ? "bg-primary/10 border-primary shadow-neon-purple"
                : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
            }`}
          >
            <div className="flex gap-2.5 items-center">
              <span className="text-lg">{mode.emoji}</span>
              <div>
                <h4 className="text-[11px] font-bold text-white group-hover:text-primary transition-colors">
                  {mode.title}
                </h4>
                <p className="text-[9px] text-text-muted mt-0.5 font-medium">
                  {mode.desc}
                </p>
              </div>
            </div>
            
            <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-white transition-colors translate-x-[-4px] group-hover:translate-x-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
