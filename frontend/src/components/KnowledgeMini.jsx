import React, { useState } from "react";
import { usePodcast } from "../context/PodcastContext";
import { Brain, FileText, ArrowRight, Check, HelpCircle, ChevronRight } from "lucide-react";

export default function KnowledgeMini() {
  const { activeEpisode, knowledgeData, setActivePage } = usePodcast();
  const [activeTab, setActiveTab] = useState("Notes"); // 'Notes' | 'Mind Map' | 'Flashcards' | 'Quiz'

  const data = knowledgeData[activeEpisode.id] || knowledgeData["e1"];

  const handleExport = () => {
    const text = data.notes.map((n) => `• ${n.content}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeEpisode.title}_Takeaways.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card p-5 border border-white/5 flex flex-col h-[280px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="w-4.5 h-4.5 text-primary" />
          <h3 className="text-sm font-heading font-bold text-white">Knowledge Hub</h3>
        </div>
        <button 
          onClick={() => setActivePage("knowledge-hub")}
          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <span>Full Page</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/5 pb-2 mb-3 shrink-0 gap-3">
        {["Notes", "Mind Map", "Flashcards", "Quiz"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[11px] font-semibold transition-all pb-1 border-b-2 -mb-[10px] cursor-pointer ${
              activeTab === tab 
                ? "text-primary border-primary" 
                : "text-text-muted border-transparent hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panel Contexts */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
        {activeTab === "Notes" && (
          <div className="flex gap-4 items-start h-full">
            {/* Notes List */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {data.notes.slice(0, 3).map((note) => (
                <div key={note.id} className="flex gap-2 items-start">
                  <span className="text-primary text-[10px] mt-1 shrink-0">•</span>
                  <p className="text-[10.5px] leading-relaxed text-slate-300 font-medium">
                    {note.content}
                  </p>
                </div>
              ))}
              
              <button 
                onClick={handleExport}
                className="mt-2 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
              >
                Export Notes
              </button>
            </div>

            {/* Pulsing SVG Brain Mesh on the Right */}
            <div className="w-24 h-24 shrink-0 relative flex items-center justify-center bg-primary/5 rounded-2xl border border-primary/10 overflow-hidden">
              <svg className="w-20 h-20 text-primary pulse-glow" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Brain lobes representation */}
                <path d="M50,15 C25,15 15,30 20,50 C15,70 30,85 50,85 C70,85 85,70 80,50 C85,30 75,15 50,15 Z" stroke="url(#brainGrad)" strokeWidth="1.5" strokeDasharray="3 3" />
                {/* Neural pathways */}
                <path d="M50,20 L50,80" stroke="url(#brainGrad)" strokeWidth="1" opacity="0.4" />
                <path d="M30,50 L70,50" stroke="url(#brainGrad)" strokeWidth="1" opacity="0.4" />
                <path d="M35,35 L65,65" stroke="url(#brainGrad)" strokeWidth="1" opacity="0.3" />
                <path d="M65,35 L35,65" stroke="url(#brainGrad)" strokeWidth="1" opacity="0.3" />
                {/* Neural nodes */}
                <circle cx="50" cy="50" r="4" fill="#FF5E9C" className="pulse-glow" />
                <circle cx="35" cy="35" r="3" fill="#7B5EFF" />
                <circle cx="65" cy="35" r="3" fill="#7B5EFF" />
                <circle cx="35" cy="65" r="3" fill="#7B5EFF" />
                <circle cx="65" cy="65" r="3" fill="#7B5EFF" />
                <circle cx="20" cy="50" r="3.5" fill="#00E5A0" />
                <circle cx="80" cy="50" r="3.5" fill="#00E5A0" />
                <circle cx="50" cy="15" r="3" fill="#FF8C42" />
                <circle cx="50" cy="85" r="3" fill="#FF8C42" />
                
                <defs>
                  <linearGradient id="brainGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7B5EFF" />
                    <stop offset="100%" stopColor="#FF5E9C" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        )}

        {activeTab === "Mind Map" && (
          <div className="h-full flex flex-col justify-center items-center text-center p-4">
            <p className="text-[11.5px] font-semibold text-white mb-2">Interactive SVG Nodes Map</p>
            <p className="text-[10px] text-text-muted mb-4 max-w-[200px]">Expand or collapse neural connections of this podcast's concepts.</p>
            <button 
              onClick={() => setActivePage("knowledge-hub")}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-[10px] transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Explore Mind Map</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {activeTab === "Flashcards" && (
          <div className="h-full flex flex-col justify-center items-center text-center p-4">
            <p className="text-[11.5px] font-semibold text-white mb-2">3D Flips Flashcards</p>
            <p className="text-[10px] text-text-muted mb-4">Study 5 interactive AI-generated core questions.</p>
            <button 
              onClick={() => setActivePage("knowledge-hub")}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-[10px] transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Open Flashcards</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {activeTab === "Quiz" && (
          <div className="h-full flex flex-col justify-center items-center text-center p-4">
            <p className="text-[11.5px] font-semibold text-white mb-2">Take the Quiz</p>
            <p className="text-[10px] text-text-muted mb-4">Check your understanding with instant score evaluations.</p>
            <button 
              onClick={() => setActivePage("knowledge-hub")}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-[10px] transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Start Quiz</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
