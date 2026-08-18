import React, { useState, useRef, useEffect } from "react";
import { usePodcast } from "../context/PodcastContext";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Bot, User, Minimize2, Maximize2 } from "lucide-react";

export default function ChatPanel({ isDashboard = false }) {
  const { activeEpisode, chatHistory, sendChatMessage } = usePodcast();
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isManualCollapsed, setIsManualCollapsed] = useState(false);
  const [expandedSourceMsgId, setExpandedSourceMsgId] = useState(null);
  const scrollRef = useRef(null);

  const activeHistory = chatHistory[activeEpisode.id] || [];

  const episodeChips = {
    e1: [
      "What is the lost generation?",
      "How do bricklaying robots help?",
      "What was discussed at the current timestamp?",
      "Key takeaways"
    ],
    e2: [
      "Why are dating habits changing?",
      "What are virtual screening dates?",
      "What was discussed at the current timestamp?",
      "Key takeaways"
    ],
    e3: [
      "What is spatial ego-location?",
      "What causes out-of-body states?",
      "What was discussed at the current timestamp?",
      "Key takeaways"
    ],
    e4: [
      "What is Theory of Mind?",
      "How does fiction alter empathy?",
      "What was discussed at the current timestamp?",
      "Key takeaways"
    ],
    e5: [
      "How can we train focus from out-of-body states?",
      "What is cognitive agility?",
      "What was discussed at the current timestamp?",
      "Key takeaways"
    ],
    e6: [
      "How does narrative mapping help the hippocampus?",
      "How does immersion fight digital distraction?",
      "What was discussed at the current timestamp?",
      "Key takeaways"
    ],
    e7: [
      "What is the recruitment rate?",
      "Where is the documentary based?",
      "What was discussed at the current timestamp?",
      "Key takeaways"
    ],
    e8: [
      "How does Beyonce retain leverage?",
      "What is her branding strategy?",
      "What was discussed at the current timestamp?",
      "Key takeaways"
    ],
    e9: [
      "What nervous system is stimulated?",
      "What is diaphragmatic breathing?",
      "What was discussed at the current timestamp?",
      "Key takeaways"
    ],
    e10: [
      "What is Interoception?",
      "How does body scanning work?",
      "What was discussed at the current timestamp?",
      "Key takeaways"
    ]
  };

  const quickChips = episodeChips[activeEpisode.id] || [
    "Explain the main topic",
    "Give me a summary",
    "What was discussed at the current timestamp?",
    "Key takeaways"
  ];

  // Auto-scroll chat window
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeHistory, isTyping]);

  const expanded = (isFocused || activeHistory.length > 0 || isTyping || inputText.trim().length > 0) && !isManualCollapsed;

  // Reset manual collapse when switching episodes
  useEffect(() => {
    setIsManualCollapsed(false);
  }, [activeEpisode.id]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsManualCollapsed(false);
    sendChatMessage(activeEpisode.id, inputText.trim());
    setInputText("");
    setIsTyping(true);

    // Turn off typing animation after delay (matches response delay in context)
    setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  const handleChipClick = (chip) => {
    setIsManualCollapsed(false);
    sendChatMessage(activeEpisode.id, chip);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div 
      className={`glass-card p-6 border border-white/5 flex flex-col transition-all duration-300 ease-in-out ${
        expanded 
          ? (isDashboard ? "h-[380px]" : "h-full min-h-[540px]") 
          : "h-[90px] overflow-hidden"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0 h-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary fill-primary/10" />
          <h3 className="text-base font-heading font-bold text-white">Chat with Podcast</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-text-muted hidden sm:inline-block">
            Active Episode Analysis
          </span>
          <button
            type="button"
            onClick={() => setIsManualCollapsed(!isManualCollapsed)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all cursor-pointer flex items-center justify-center"
            title={expanded ? "Collapse Chat" : "Expand Chat"}
          >
            {expanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Rest of the component, shown only when expanded */}
      <div 
        className={`flex-1 flex flex-col min-h-0 transition-opacity duration-300 ${
          expanded ? "opacity-100 mt-2" : "opacity-0 pointer-events-none h-0 overflow-hidden"
        }`}
      >
        {/* Quick Prompts Chips */}
        <div className="flex flex-wrap gap-2 py-3 shrink-0 select-none">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(chip)}
              className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-white/5 hover:bg-primary/15 border border-white/5 hover:border-primary/20 text-slate-300 hover:text-white transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Chat Stream Bubble Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto pr-1 space-y-4 my-2 scrollbar-thin min-h-0"
        >
          <AnimatePresence initial={false}>
            {activeHistory.map((msg, index) => {
              const isBot = msg.role === "assistant";
              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`flex gap-3 items-start ${!isBot ? "justify-end" : "justify-start"}`}
                >
                  {/* Bot Icon */}
                  {isBot && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble content */}
                  <div 
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed font-medium ${
                      isBot 
                        ? "bg-white/[0.02] border border-white/5 text-slate-200 rounded-tl-sm" 
                        : "bg-gradient-to-r from-primary to-secondary text-white rounded-tr-sm shadow-neon-purple"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    
                    {isBot && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-white/5 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedSourceMsgId(expandedSourceMsgId === msg.id ? null : msg.id)}
                          className="text-[9px] font-bold text-primary hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-none outline-none p-0"
                        >
                          <span>{expandedSourceMsgId === msg.id ? "▼" : "▶"} Retrieved Sources ({msg.sources.length})</span>
                        </button>
                        
                        {expandedSourceMsgId === msg.id && (
                          <div className="space-y-2 text-[10px] text-text-muted mt-1 leading-relaxed pl-1 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin">
                            {msg.sources.map((src, idx) => (
                              <div key={idx} className="p-2 rounded bg-white/[0.01] border border-white/5 space-y-1 text-slate-400">
                                <div className="flex justify-between font-bold text-[9px] text-slate-300">
                                  <span>Source #{idx+1} (Approx {src.timestamp})</span>
                                  <span className="font-mono text-secondary">Sim: {(src.score * 100).toFixed(0)}%</span>
                                </div>
                                <p className="italic text-[9.5px]">"{src.text}"</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end mt-1.5">
                      <span className={`text-[9px] ${isBot ? "text-text-muted" : "text-white/60"}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* User Icon */}
                  {!isBot && (
                    <div className="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/25 flex items-center justify-center text-secondary shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Animated Bot Typing Loader */}
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 items-start"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl rounded-tl-sm p-4 flex gap-1.5 items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Form Bar */}
        <form onSubmit={handleSubmit} className="flex gap-3 pt-3 border-t border-white/5 shrink-0">
          <input
            type="text"
            value={inputText}
            onFocus={() => {
              setIsFocused(true);
              setIsManualCollapsed(false);
            }}
            onBlur={() => {
              // Wait slightly before setting focused false to allow button clicks inside panel
              setTimeout(() => setIsFocused(false), 250);
            }}
            onChange={(e) => {
              setInputText(e.target.value);
              setIsManualCollapsed(false);
            }}
            placeholder="Ask anything about this podcast..."
            className="flex-1 text-xs py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all focus:ring-1 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="p-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-neon-purple"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

      {/* Compact input field visible when NOT expanded */}
      {!expanded && (
        <div className="flex gap-3 mt-3 items-center shrink-0">
          <input
            type="text"
            placeholder="Click to start chatting about this podcast..."
            onFocus={() => {
              setIsManualCollapsed(false);
              setIsFocused(true);
            }}
            onClick={() => {
              setIsManualCollapsed(false);
              setIsFocused(true);
            }}
            readOnly
            className="flex-1 text-xs py-2 px-4 rounded-xl bg-white/[0.02] border border-white/5 text-text-muted cursor-pointer outline-none hover:bg-white/[0.04] transition-all"
          />
          <button
            type="button"
            onClick={() => {
              setIsManualCollapsed(false);
              setIsFocused(true);
            }}
            className="p-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white transition-all flex items-center justify-center cursor-pointer shadow-neon-purple"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
