import React from "react";
import { usePodcast } from "../context/PodcastContext";
import { motion } from "framer-motion";
import ChatPanel from "../components/ChatPanel";
import { MessageSquare, Radio, Calendar } from "lucide-react";

export default function ChatWithPodcastPage() {
  const { episodes, activeEpisode, selectEpisode } = usePodcast();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 md:p-8 max-w-[1800px] mx-auto lg:ml-64 ml-0 flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] min-h-[720px]"
    >
      {/* Left Panel: Episodes Context Selector (1/4 width) */}
      <div className="w-full lg:w-1/4 rounded-3xl bg-[#13131A] border border-white/5 p-5 flex flex-col min-h-[260px] lg:min-h-0 shrink-0">
        <div className="pb-3 border-b border-white/5 mb-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <span>Chat Session Context</span>
          </h3>
          <p className="text-[10.5px] text-text-muted mt-1 leading-normal">
            Choose an episode below to inject its transcripts into the AI reasoning context.
          </p>
        </div>

        {/* List of episodes */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {episodes.map((ep) => {
            const isActive = ep.id === activeEpisode.id;
            return (
              <button
                key={ep.id}
                onClick={() => selectEpisode(ep)}
                className={`w-full p-3 rounded-2xl text-left border flex gap-3 transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary/10 border-primary shadow-neon-purple"
                    : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                }`}
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={ep.thumbnail}
                    alt={ep.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate leading-snug group-hover:text-primary">
                    {ep.title}
                  </h4>
                  <p className="text-[10px] text-text-muted mt-1 font-medium flex items-center gap-1.5">
                    <span>{ep.duration}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-white/10" />
                    <span>Host: {ep.host}</span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Chat Stream Workspace (2/3 width) */}
      <div className="flex-1 rounded-3xl overflow-hidden flex flex-col h-full bg-[#13131A] border border-white/5">
        {/* We can embed our ChatPanel but configure it to take full height! */}
        <div className="flex-1 flex flex-col h-full">
          <ChatPanel />
        </div>
      </div>

    </motion.div>
  );
}
