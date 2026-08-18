import React from "react";
import { usePodcast } from "../context/PodcastContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronRight } from "lucide-react";

export default function EmotionTimelineMini() {
  const { activeEpisode, emotionTimelines, setActivePage } = usePodcast();
  const data = emotionTimelines[activeEpisode.id] || emotionTimelines["e1"];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#13131A] border border-white/10 p-2.5 rounded-xl shadow-2xl text-[10px] space-y-1">
          <p className="font-bold text-white">Time: {payload[0].payload.timestamp}</p>
          <p className="text-text-muted italic max-w-[150px]">"{payload[0].payload.quote}"</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 border-t border-white/5 pt-1">
            <span className="text-orange-400 font-medium">🔥 Exc: {payload[0].payload.excitement}%</span>
            <span className="text-blue-400 font-medium">⚡ Cur: {payload[0].payload.curiosity}%</span>
            <span className="text-purple-400 font-medium">😮 Sur: {payload[0].payload.surprise}%</span>
            <span className="text-teal-400 font-medium">🧠 Thk: {payload[0].payload.deepThinking}%</span>
            <span className="text-green-400 font-medium">😊 Joy: {payload[0].payload.joy}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-5 border border-white/5 flex flex-col h-[280px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-primary">📈</span>
          <h3 className="text-sm font-heading font-bold text-white">Emotion Timeline</h3>
        </div>
        <button 
          onClick={() => setActivePage("emotion-timeline")}
          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <span>View All</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Chart container */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis 
              dataKey="timestamp" 
              stroke="#8888AA" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#8888AA" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false} 
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* 5 curves representing different emotions */}
            <Line 
              type="monotone" 
              dataKey="excitement" 
              stroke="#FF8C42" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4 }} 
            />
            <Line 
              type="monotone" 
              dataKey="curiosity" 
              stroke="#3B82F6" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4 }} 
            />
            <Line 
              type="monotone" 
              dataKey="surprise" 
              stroke="#7B5EFF" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4 }} 
            />
            <Line 
              type="monotone" 
              dataKey="deepThinking" 
              stroke="#00F5D4" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4 }} 
            />
            <Line 
              type="monotone" 
              dataKey="joy" 
              stroke="#00E5A0" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend list indicators */}
      <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 mt-2 text-[8px] font-bold text-text-muted shrink-0">
        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF8C42]" /><span>EXCITEMENT</span></div>
        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /><span>CURIOSITY</span></div>
        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#7B5EFF]" /><span>SURPRISE</span></div>
        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4]" /><span>DEEP THINKING</span></div>
        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]" /><span>JOY</span></div>
      </div>
    </div>
  );
}
