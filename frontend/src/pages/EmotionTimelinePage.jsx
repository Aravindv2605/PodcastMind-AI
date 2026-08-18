import React from "react";
import { usePodcast } from "../context/PodcastContext";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  CartesianGrid, 
  ReferenceLine, 
  ReferenceDot, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertCircle, PlayCircle } from "lucide-react";

export default function EmotionTimelinePage() {
  const { 
    activeEpisode, 
    activePodcast,
    emotionTimelines, 
    setCurrentTime, 
    setIsPlaying, 
    formatTime,
    currentTime,
    isPlaying,
    skipEvents,
    podcastSwaps,
    getInterpolatedEmotion
  } = usePodcast();

  const data = emotionTimelines[activeEpisode.id] || emotionTimelines["e1"];

  // Click on chart coordinates to seek to clicked second
  const handleChartClick = (state) => {
    if (state && state.activeLabel !== undefined) {
      setCurrentTime(Math.round(state.activeLabel));
      setIsPlaying(true); // Play on seek
    }
  };

  // Pie chart calculation
  // Let's summarize the averages for the pie chart
  const averageEmotions = data.reduce((acc, point) => {
    acc.excitement += point.excitement;
    acc.curiosity += point.curiosity;
    acc.surprise += point.surprise;
    acc.deepThinking += point.deepThinking;
    acc.joy += point.joy;
    return acc;
  }, { excitement: 0, curiosity: 0, surprise: 0, deepThinking: 0, joy: 0 });

  const totalPoints = data.length;
  const pieData = [
    { name: "Excitement", value: Math.round(averageEmotions.excitement / totalPoints), color: "#FF8C42" },
    { name: "Curiosity", value: Math.round(averageEmotions.curiosity / totalPoints), color: "#3B82F6" },
    { name: "Surprise", value: Math.round(averageEmotions.surprise / totalPoints), color: "#7B5EFF" },
    { name: "Deep Thinking", value: Math.round(averageEmotions.deepThinking / totalPoints), color: "#00F5D4" },
    { name: "Joy", value: Math.round(averageEmotions.joy / totalPoints), color: "#00E5A0" }
  ];

  // Top 3 emotional moments
  // Sort data points by absolute highest excitement or surprise or joy
  const sortedMoments = [...data].sort((a, b) => {
    const maxA = Math.max(a.excitement, a.surprise, a.joy);
    const maxB = Math.max(b.excitement, b.surprise, b.joy);
    return maxB - maxA;
  });
  const topMoments = sortedMoments.slice(0, 3);

  // Retrieve interpolated emotions at the current time for real-time playhead tooltip
  const currentEmotions = getInterpolatedEmotion(activeEpisode.id, currentTime);

  // Position the floating detail tooltip (constrain between 5% and 80%)
  const playheadPercent = activeEpisode.durationSeconds > 0 
    ? (currentTime / activeEpisode.durationSeconds) * 100 
    : 0;
  const tooltipLeft = Math.min(80, Math.max(5, playheadPercent));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto lg:ml-64 ml-0 min-h-screen animate-fade-in"
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2">
            <span>📈 Interactive Audio-Sync Timelines</span>
          </h2>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Biometric and tone sentiment mapping sync'd with the player. Click coordinates on the chart to seek the player.
          </p>
        </div>
      </div>

      {/* Large Line Chart with Real-time Seek Overlay */}
      <div className="glass-card p-6 border border-white/5 relative overflow-visible">
        <h3 className="text-sm font-heading font-bold text-slate-200 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Interactive Audio-Sync Timelines</span>
          </div>
          {isPlaying && (
            <span className="text-[10px] bg-primary/20 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold animate-pulse uppercase tracking-wider">
              Syncing Live
            </span>
          )}
        </h3>

        {/* Floating Tooltip matching mockup style */}
        {currentEmotions && (
          <div 
            className="absolute top-16 z-20 pointer-events-none bg-[#13131A]/95 border border-white/10 p-4.5 rounded-xl shadow-2xl text-xs space-y-2.5 w-[240px] select-none backdrop-blur-md transition-all duration-300 ease-out"
            style={{ left: `${tooltipLeft}%`, transform: 'translateX(-50%)' }}
          >
            <p className="font-bold text-white text-[11px] border-b border-white/5 pb-1">
              Seek position: {formatTime(currentTime)}
            </p>
            <p className="text-[10px] text-text-muted italic leading-relaxed">
              "{currentEmotions.quote}"
            </p>
            <div className="space-y-1.5 border-t border-white/5 pt-2 text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-[#FF8C42] font-semibold flex items-center gap-1">🔥 Excitement:</span>
                <span className="text-white font-bold">{currentEmotions.excitement}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#3B82F6] font-semibold flex items-center gap-1">⚡ Curiosity:</span>
                <span className="text-white font-bold">{currentEmotions.curiosity}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7B5EFF] font-semibold flex items-center gap-1">😮 Surprise:</span>
                <span className="text-white font-bold">{currentEmotions.surprise}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#00F5D4] font-semibold flex items-center gap-1">🧠 Deep Thinking:</span>
                <span className="text-white font-bold">{currentEmotions.deepThinking}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#00E5A0] font-semibold flex items-center gap-1">😊 Joy:</span>
                <span className="text-white font-bold">{currentEmotions.joy}%</span>
              </div>
            </div>
            <span className="text-[9px] text-[#7B5EFF] font-bold block text-center border-t border-white/5 pt-1 animate-pulse">
              Click timeline to jump player here
            </span>
          </div>
        )}

        <div className="w-full h-80 relative select-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data} 
              onClick={handleChartClick}
              margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="timestampSeconds" 
                type="number"
                domain={[0, activeEpisode.durationSeconds]}
                tickFormatter={(val) => formatTime(val)}
                stroke="#8888AA" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#8888AA" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                domain={[0, 100]}
              />

              {/* Solid Vertical Line representing Current Seek Position */}
              <ReferenceLine 
                x={currentTime} 
                stroke="rgba(255, 255, 255, 0.4)" 
                strokeWidth={1.5} 
              />

              {/* Dots representing intersections of emotions with playhead position */}
              {currentEmotions && (
                <>
                  <ReferenceDot x={currentTime} y={currentEmotions.excitement} r={5} fill="#FF8C42" stroke="#ffffff" strokeWidth={1.5} isFront />
                  <ReferenceDot x={currentTime} y={currentEmotions.curiosity} r={5} fill="#3B82F6" stroke="#ffffff" strokeWidth={1.5} isFront />
                  <ReferenceDot x={currentTime} y={currentEmotions.surprise} r={5} fill="#7B5EFF" stroke="#ffffff" strokeWidth={1.5} isFront />
                  <ReferenceDot x={currentTime} y={currentEmotions.deepThinking} r={5} fill="#00F5D4" stroke="#ffffff" strokeWidth={1.5} isFront />
                  <ReferenceDot x={currentTime} y={currentEmotions.joy} r={5} fill="#00E5A0" stroke="#ffffff" strokeWidth={1.5} isFront />
                </>
              )}
              
              <Line type="monotone" dataKey="excitement" stroke="#FF8C42" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="curiosity" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="surprise" stroke="#7B5EFF" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="deepThinking" stroke="#00F5D4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="joy" stroke="#00E5A0" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend list indicators */}
        <div className="flex justify-center flex-wrap gap-5 mt-4 text-[10px] font-bold text-text-muted">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FF8C42]" /><span>EXCITEMENT (ORANGE)</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /><span>CURIOSITY (BLUE)</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#7B5EFF]" /><span>SURPRISE (PURPLE)</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4]" /><span>DEEP THINKING (TEAL)</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#00E5A0]" /><span>JOY (GREEN)</span></div>
        </div>
      </div>

      {/* Playback Interaction & Skip Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Skip Logs & Swap Stats */}
        <div className="glass-card p-6 border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
              <span>🔄 Playback Skip Events Log</span>
            </h3>
            <span className="text-[10px] text-text-muted font-bold uppercase bg-white/5 px-2 py-0.5 rounded">
              Active Session
            </span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
            {skipEvents.length === 0 ? (
              <div className="text-center py-12 text-xs text-text-muted italic">
                No skips recorded in this session. Skip tracks or click the visualizer to generate analysis.
              </div>
            ) : (
              skipEvents.map((evt) => (
                <div key={evt.id} className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col gap-2 hover:bg-white/[0.02] transition-colors animate-slide-in">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className={`font-bold px-2 py-0.5 rounded-full ${
                      evt.direction === "forward" ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"
                    }`}>
                      {evt.direction === "forward" ? "⏩ Skip Forward" : "⏪ Replay / Skip Back"} (+{evt.duration}s)
                    </span>
                    <span className="text-text-muted font-mono">{evt.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Jumped from <span className="text-white font-semibold font-mono">{formatTime(evt.fromTime)}</span> to{" "}
                    <span className="text-white font-semibold font-mono">{formatTime(evt.toTime)}</span>
                  </p>
                  
                  {evt.emotionBefore && evt.emotionAfter && (
                    <div className="grid grid-cols-2 gap-4 border-t border-white/[0.03] pt-2 text-[10px]">
                      <div>
                        <span className="text-text-muted block mb-0.5">Sentiment Prior to Skip:</span>
                        <span className="font-semibold text-white flex items-center gap-1">
                          {evt.emotionBefore.dominant === "Excitement" ? "🔥" :
                           evt.emotionBefore.dominant === "Curiosity" ? "⚡" :
                           evt.emotionBefore.dominant === "Surprise" ? "😮" :
                           evt.emotionBefore.dominant === "Deep Thinking" ? "🧠" : "😊"}{" "}
                          {evt.emotionBefore.dominant} ({Math.max(
                            evt.emotionBefore.excitement,
                            evt.emotionBefore.curiosity,
                            evt.emotionBefore.surprise,
                            evt.emotionBefore.deepThinking,
                            evt.emotionBefore.joy
                          )}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block mb-0.5">Post-Skip Engagement:</span>
                        <span className="font-semibold text-primary flex items-center gap-1">
                          {evt.emotionAfter.dominant === "Excitement" ? "🔥" :
                           evt.emotionAfter.dominant === "Curiosity" ? "⚡" :
                           evt.emotionAfter.dominant === "Surprise" ? "😮" :
                           evt.emotionAfter.dominant === "Deep Thinking" ? "🧠" : "😊"}{" "}
                          {evt.emotionAfter.dominant} ({Math.max(
                            evt.emotionAfter.excitement,
                            evt.emotionAfter.curiosity,
                            evt.emotionAfter.surprise,
                            evt.emotionAfter.deepThinking,
                            evt.emotionAfter.joy
                          )}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Cognitive Behavior Analysis */}
        <div className="glass-card p-6 border border-white/5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
              <span>🧠 Tone Engagement Patterns</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 space-y-1">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Disengagement Rate</span>
                <p className="text-2xl font-extrabold text-white">
                  {skipEvents.length > 0 ? `${Math.min(90, skipEvents.length * 8)}%` : "0%"}
                </p>
                <p className="text-[9px] text-text-muted">Ratio of skipped contents in active episode</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 space-y-1">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Attention Recoveries</span>
                <p className="text-2xl font-extrabold text-primary">
                  {skipEvents.filter(e => e.direction === "backward").length}
                </p>
                <p className="text-[9px] text-text-muted">Replayed sections due to curiosity spikes</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
              <h4 className="font-semibold text-white">Behavioral Synthesis Report</h4>
              {skipEvents.length === 0 ? (
                <p className="text-text-muted text-[11px] leading-relaxed">
                  No behavioral patterns detected yet. Start listening to the podcast. As you skip or replay segments, our tone-tracking system will map your focus levels.
                </p>
              ) : (
                <div className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    We identified <span className="text-white font-bold">{skipEvents.length} playback adjustments</span> during this session.
                  </p>
                  <p>
                    {skipEvents.filter(e => e.direction === "forward").length > 0 ? (
                      <span>
                        • <strong>Forward Skips:</strong> Jumps were primarily triggered when the dialog fell under 50% excitement and curiosity. Skipping succeeded in recovering your interest, yielding an average excitement boost of{" "}
                        <span className="text-emerald-400 font-bold">+18%</span> at target markers.
                      </span>
                    ) : null}
                  </p>
                  <p>
                    {skipEvents.filter(e => e.direction === "backward").length > 0 ? (
                      <span>
                        • <strong>Curiosity Replays:</strong> Segment loops at replayed points highlight high concentration and surprise scores. The user replayed quotes to double-check technical jargon or surprising insights.
                      </span>
                    ) : null}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Podcast Swapping Events */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <h4 className="text-xs font-semibold text-slate-300">Cross-Podcast Swap Log</h4>
            <div className="space-y-2 max-h-[120px] overflow-y-auto scrollbar-thin pr-1">
              {podcastSwaps.length === 0 ? (
                <div className="text-[10px] text-text-muted italic">
                  No podcast switches logged. Swapping podcasts before completion will log metrics here.
                </div>
              ) : (
                podcastSwaps.map((swp) => (
                  <div key={swp.id} className="p-2 rounded bg-red-500/[0.02] border border-red-500/10 text-[10px] flex justify-between items-start animate-slide-in">
                    <div className="space-y-0.5">
                      <p className="text-white font-medium">
                        Abandoned: <span className="text-red-400">"{swp.fromEpisodeTitle}"</span>
                      </p>
                      <p className="text-text-muted text-[9.5px]">
                        Played: {formatTime(swp.timePlayed)} ({swp.completionRate}% complete) | Swapped to: "{swp.toEpisodeTitle}"
                      </p>
                    </div>
                    <span className="text-text-muted font-mono">{swp.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Split Row: Top Highlights & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Breakdown Table */}
        <div className="lg:col-span-2 glass-card p-6 border border-white/5 space-y-4">
          <h3 className="text-sm font-heading font-bold text-white">Sentiment Segment Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-text-muted font-bold text-[10px] uppercase">
                  <th className="py-3 px-2">Timestamp</th>
                  <th className="py-3 px-2">Dominant Emotion</th>
                  <th className="py-3 px-2 text-center">Intensity</th>
                  <th className="py-3 px-2">Key Quote segment</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((point, index) => (
                  <tr key={index} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all group">
                    <td className="py-3.5 px-2 font-mono text-primary font-semibold">{point.timestamp}</td>
                    <td className="py-3.5 px-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 ${
                        point.dominant === "Excitement" ? "text-orange-400 border border-orange-500/20" :
                        point.dominant === "Curiosity" ? "text-blue-400 border border-blue-500/20" :
                        point.dominant === "Surprise" ? "text-purple-400 border border-purple-500/20" :
                        point.dominant === "Deep Thinking" ? "text-teal-400 border border-teal-500/20" :
                        "text-green-400 border border-green-500/20"
                      }`}>
                        {point.dominant}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center font-bold text-white">
                      {Math.max(point.excitement, point.curiosity, point.surprise, point.deepThinking, point.joy)}%
                    </td>
                    <td className="py-3.5 px-2 text-slate-300 max-w-[240px] truncate font-medium">
                      "{point.quote}"
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <button
                        onClick={() => {
                          setCurrentTime(point.timestampSeconds);
                          setIsPlaying(true);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-primary/20 text-text-muted hover:text-primary transition-all cursor-pointer group-hover:scale-105"
                      >
                        <PlayCircle className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Distribution Pie & Top Highlights */}
        <div className="space-y-6">
          {/* Pie Chart */}
          <div className="glass-card p-6 border border-white/5 flex flex-col items-center">
            <h3 className="text-sm font-heading font-bold text-white self-start mb-4">Overall Distribution</h3>
            <div className="w-full h-44 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Metrics</span>
                <span className="text-base font-extrabold text-white">Bio-tone</span>
              </div>
            </div>
            
            {/* Pie Legends values */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] font-bold text-slate-300 mt-2">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name}: {d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 Moments */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-heading font-bold text-white">Peak Highlights</h3>
            <div className="space-y-3">
              {topMoments.map((moment, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setCurrentTime(moment.timestampSeconds);
                    setIsPlaying(true);
                  }}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all cursor-pointer flex gap-3 items-center group"
                >
                  <span className="w-6 h-6 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 group-hover:scale-105">
                    {moment.timestamp}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold text-white truncate">
                      Dominant: {moment.dominant}
                    </p>
                    <p className="text-[9.5px] text-text-muted truncate mt-0.5">
                      "{moment.quote}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
