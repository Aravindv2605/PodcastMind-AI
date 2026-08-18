import React, { useState, useRef, useEffect } from "react";
import { usePodcast } from "../context/PodcastContext";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Settings, Sparkles, Bot, User, Volume2, ShieldAlert } from "lucide-react";

export default function AiHostTwinPage() {
  const {
    aiHostTwinHistory,
    sendHostTwinMessage,
    twinPersonality,
    setTwinPersonality,
    twinVoiceMode,
    setTwinVoiceMode,
    isHostSpeaking
  } = usePodcast();

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiHostTwinHistory, isTyping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText("");
    setIsTyping(true);
    try {
      await sendHostTwinMessage(text);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsTyping(false);
    }
  };

  // Define Coordinates for SVG Brain Neural Mesh Nodes
  const nodes = [
    { id: 1, x: 50, y: 15, delay: 0, size: 6, color: "#FF5E9C" }, // top
    { id: 2, x: 35, y: 25, delay: 0.5, size: 4, color: "#7B5EFF" },
    { id: 3, x: 65, y: 25, delay: 1, size: 4, color: "#7B5EFF" },
    { id: 4, x: 25, y: 40, delay: 1.5, size: 5, color: "#00E5A0" }, // left frontal
    { id: 5, x: 45, y: 40, delay: 0.2, size: 4, color: "#7B5EFF" },
    { id: 6, x: 55, y: 40, delay: 0.8, size: 4, color: "#7B5EFF" },
    { id: 7, x: 75, y: 40, delay: 2, size: 5, color: "#00E5A0" }, // right frontal
    { id: 8, x: 20, y: 55, delay: 1.2, size: 6, color: "#FF8C42" }, // left temp
    { id: 9, x: 40, y: 55, delay: 0.6, size: 4, color: "#7B5EFF" },
    { id: 10, x: 60, y: 55, delay: 1.4, size: 4, color: "#7B5EFF" },
    { id: 11, x: 80, y: 55, delay: 0.3, size: 6, color: "#FF8C42" }, // right temp
    { id: 12, x: 35, y: 70, delay: 1.7, size: 4, color: "#7B5EFF" },
    { id: 13, x: 65, y: 70, delay: 0.9, size: 4, color: "#7B5EFF" },
    { id: 14, x: 50, y: 80, delay: 2.2, size: 5, color: "#FF5E9C" }, // base
    { id: 15, x: 50, y: 92, delay: 0.4, size: 4, color: "#00E5A0" }  // brainstem
  ];

  // Connections lines mapping index references
  const links = [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 2, to: 4 }, { from: 2, to: 5 }, { from: 3, to: 6 }, { from: 3, to: 7 },
    { from: 4, to: 8 }, { from: 5, to: 9 }, { from: 6, to: 10 }, { from: 7, to: 11 },
    { from: 8, to: 9 }, { from: 9, to: 10 }, { from: 10, to: 11 },
    { from: 8, to: 12 }, { from: 9, to: 12 }, { from: 10, to: 13 }, { from: 11, to: 13 },
    { from: 12, to: 14 }, { from: 13, to: 14 },
    { from: 14, to: 15 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 md:p-8 max-w-[1600px] mx-auto lg:ml-64 ml-0 flex flex-col lg:flex-row gap-6 h-[calc(100vh-80px)] min-h-[600px]"
    >
      {/* Left Panel: Glowing Interactive Neural Mesh Avatar */}
      <div className="w-full lg:w-1/2 rounded-3xl bg-[#13131A] border border-white/5 relative flex flex-col items-center justify-center p-8 overflow-hidden group shrink-0">
        
        {/* Glowing background rings */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/15 transition-all duration-500" />
        <div className="absolute w-[250px] h-[250px] rounded-full bg-secondary/5 blur-2xl group-hover:bg-secondary/10 transition-all duration-500" />

        {/* Neural Network SVG */}
        <div className="w-full max-w-[400px] h-[400px] relative z-10 flex items-center justify-center select-none">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Draw connecting lines with dynamic stroke animation */}
            {links.map((link, idx) => {
              const nodeA = nodes.find((n) => n.id === link.from);
              const nodeB = nodes.find((n) => n.id === link.to);
              if (!nodeA || !nodeB) return null;

              return (
                <motion.line
                  key={`link-${idx}`}
                  x1={nodeA.x}
                  y1={nodeA.y}
                  x2={nodeB.x}
                  y2={nodeB.y}
                  stroke="url(#neuralGrad)"
                  strokeWidth={isTyping ? 1.0 : (isHostSpeaking ? 0.85 : 0.65)}
                  initial={{ strokeDasharray: "10 5", strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: [-15, 15] }}
                  transition={{
                    repeat: Infinity,
                    duration: isTyping ? 1.2 : (isHostSpeaking ? 1.8 : 4.0),
                    ease: "linear"
                  }}
                  opacity={isTyping ? 0.7 : (isHostSpeaking ? 0.55 : 0.35)}
                />
              );
            })}

            {/* Draw nodes with floating animations */}
            {nodes.map((node) => (
              <g key={`node-${node.id}`}>
                {/* Outer Glow Circle */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={isTyping 
                    ? node.size * 2.5 
                    : (isHostSpeaking 
                      ? node.size * 2.1 
                      : node.size * 1.8)}
                  fill={node.color}
                  opacity={isTyping ? 0.35 : (isHostSpeaking ? 0.22 : 0.12)}
                  animate={{
                    r: isTyping 
                      ? [node.size * 2.0, node.size * 3.2, node.size * 2.0]
                      : (isHostSpeaking 
                        ? [node.size * 1.8, node.size * 2.8, node.size * 1.8]
                        : [node.size * 1.5, node.size * 2.2, node.size * 1.5]),
                    opacity: isTyping 
                      ? [0.2, 0.45, 0.2]
                      : (isHostSpeaking 
                        ? [0.15, 0.35, 0.15]
                        : [0.1, 0.2, 0.1])
                  }}
                  transition={{
                    duration: isTyping ? 1.0 : (isHostSpeaking ? 1.2 : 3.0),
                    repeat: Infinity,
                    delay: isHostSpeaking ? (node.x + node.y) * 0.015 : node.delay,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Solid Core Node */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size / 2}
                  fill={node.color}
                  animate={{
                    y: isTyping 
                      ? [node.y - 1.2, node.y + 1.2, node.y - 1.2]
                      : (isHostSpeaking 
                        ? [node.y - 2.0, node.y + 2.0, node.y - 2.0]
                        : [node.y - 0.8, node.y + 0.8, node.y - 0.8])
                  }}
                  transition={{
                    duration: isTyping ? 1.5 : (isHostSpeaking ? 1.2 : 4.0),
                    repeat: Infinity,
                    delay: isHostSpeaking ? (node.x + node.y) * 0.015 : node.delay,
                    ease: "easeInOut"
                  }}
                />
              </g>
            ))}

            {/* Definitions */}
            <defs>
              <linearGradient id="neuralGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7B5EFF" />
                <stop offset="100%" stopColor="#FF5E9C" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Avatar Status Label overlay */}
        <div className="absolute bottom-8 text-center space-y-2 z-10">
          <div className="flex items-center gap-2.5 justify-center">
            <span className="w-2 h-2 rounded-full bg-success animate-ping" />
            <span className="text-xs font-bold text-white tracking-widest uppercase">
              Alex Carter Digital Twin
            </span>
          </div>
          <p className="text-[10px] text-text-muted font-semibold max-w-xs leading-relaxed">
            Neural voice synthesizer online. Trained on 124 hours of audio interviews.
          </p>
        </div>

      </div>

      {/* Right Panel: Conversation Chat window */}
      <div className="w-full lg:w-1/2 rounded-3xl bg-[#13131A] border border-white/5 flex flex-col justify-between overflow-hidden">
        
        {/* Chat Header and settings */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-background/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary p-[1px] flex items-center justify-center shadow">
              <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Alex Carter AI Twin</h3>
              <p className="text-[9px] text-success font-semibold flex items-center gap-1 mt-0.5">
                <span>Active</span>
              </p>
            </div>
          </div>

          {/* Personality settings controls */}
          <div className="flex items-center gap-2">
            {/* Personality selector */}
            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5">
              {["Casual", "Professional", "Debate"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTwinPersonality(mode === "Debate" ? "Debate Mode" : mode)}
                  className={`px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer ${
                    (mode === "Debate" ? "Debate Mode" : mode) === twinPersonality
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-white"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Voice Mic Toggle */}
            <button
              onClick={() => setTwinVoiceMode(!twinVoiceMode)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                twinVoiceMode 
                  ? "bg-secondary/15 border-secondary text-secondary" 
                  : "bg-white/5 border-white/5 text-text-muted hover:text-white"
              }`}
            >
              {twinVoiceMode ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Chat History Panel */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin"
        >
          {/* Default training system notice */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3 items-start">
            <ShieldAlert className="w-4.5 h-4.5 text-primary mt-0.5 shrink-0" />
            <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
              <span className="text-white font-bold block mb-0.5">AI Twin System Message</span>
              I am the AI Digital Twin of Alex Carter. I have been trained on all episodes of The AI Revolution Podcast. Ask me anything!
            </p>
          </div>

          {/* Messages */}
          <AnimatePresence initial={false}>
            {aiHostTwinHistory.map((msg) => {
              const isBot = msg.role === "assistant";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 items-start ${!isBot ? "justify-end" : "justify-start"}`}
                >
                  {isBot && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div 
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed font-medium ${
                      isBot 
                        ? "bg-white/[0.02] border border-white/5 text-slate-200 rounded-tl-sm" 
                        : "bg-gradient-to-r from-primary to-secondary text-white rounded-tr-sm shadow-neon-purple"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <div className="flex justify-end mt-1.5">
                      <span className={`text-[9px] ${isBot ? "text-text-muted" : "text-white/60"}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>

                  {!isBot && (
                    <div className="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/25 flex items-center justify-center text-secondary shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing */}
          {isTyping && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl rounded-tl-sm p-4 flex gap-1.5 items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Chat input form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 shrink-0 bg-background/20 flex gap-3 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask Digital Twin in ${twinPersonality} mode...`}
            className="flex-1 text-xs py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all focus:ring-1 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="p-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-neon-purple"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </motion.div>
  );
}
