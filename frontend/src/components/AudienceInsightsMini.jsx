import React from "react";
import { usePodcast } from "../context/PodcastContext";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";

export default function AudienceInsightsMini() {
  const { activeEpisode, audienceInsights, setActivePage } = usePodcast();
  const insights = audienceInsights[activeEpisode.id] || audienceInsights["e1"];

  // SVG Donut settings
  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (insights.engagementScore / 100) * circumference;

  return (
    <div className="glass-card p-5 border border-white/5 flex flex-col h-[280px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 shrink-0">
        <h3 className="text-sm font-heading font-bold text-white">Audience Insights</h3>
        <button 
          onClick={() => setActivePage("audience-insights")}
          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <span>View All</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Main stats + Donut layout */}
      <div className="flex-1 flex gap-4 items-center justify-between min-h-0">
        {/* Left Side: Stats column */}
        <div className="space-y-3.5 flex-1">
          {/* Retention */}
          <div className="space-y-1">
            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Audience Retention</span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-white">{insights.audienceRetention}%</span>
              <span className="text-[10px] font-bold text-success flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>+12%</span>
              </span>
            </div>
          </div>

          {/* Average Watch time */}
          <div className="space-y-1">
            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Avg. Watch Time</span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-white">{insights.avgWatchTime}</span>
              <span className="text-[10px] font-bold text-success flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>+8%</span>
              </span>
            </div>
          </div>

          {/* Drop-off Point */}
          <div className="space-y-1">
            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Drop-off Point</span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-white">{insights.dropoffPoint}</span>
              <span className="text-[10px] font-bold text-red-400 flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />
                <span>-5%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Donut score */}
        <div className="relative shrink-0 flex items-center justify-center p-2">
          <svg className="w-28 h-28 transform -rotate-90" width={size} height={size}>
            {/* Background track circle */}
            <circle
              className="text-white/[0.04]"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
            {/* Gradient fill progress circle */}
            <circle
              stroke="url(#donutGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
            {/* Defs definition for donut Gradient */}
            <defs>
              <linearGradient id="donutGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7B5EFF" />
                <stop offset="100%" stopColor="#FF5E9C" />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered text label inside donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold tracking-tight text-white neon-text-purple">
              {insights.engagementScore}%
            </span>
            <span className="text-[9px] text-text-muted font-semibold uppercase tracking-wider scale-90">
              Engagement
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
