import React, { useState } from "react";
import { usePodcast } from "../context/PodcastContext";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Users, Timer, Sparkles, TrendingUp, Laptop, Globe, ArrowUpDown } from "lucide-react";

export default function AudienceInsightsPage() {
  const { activeEpisode, audienceInsights, episodes } = usePodcast();
  const insights = audienceInsights[activeEpisode.id] || audienceInsights["e1"];

  // Sortable Episodes Table
  const [sortField, setSortField] = useState("plays");
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedEpisodes = [...episodes].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    // Clean strings like "38,420"
    if (typeof valA === "string") valA = parseInt(valA.replace(/,/g, ""), 10) || 0;
    if (typeof valB === "string") valB = parseInt(valB.replace(/,/g, ""), 10) || 0;

    return sortAsc ? valA - valB : valB - valA;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto lg:ml-64 ml-0 min-h-screen"
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2">
            <span>📊 Creator Analytics & Insights</span>
          </h2>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Biometric watch metrics, device segmentation, and geographic heatmap tracking
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="glass-card p-5 border border-white/5 flex items-center gap-4 hover:border-primary/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Total Listens</span>
            <span className="text-lg font-heading font-extrabold text-white">{insights.totalListens}</span>
            <span className="text-[9px] text-success font-bold block mt-0.5">↑ 14% this month</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-5 border border-white/5 flex items-center gap-4 hover:border-primary/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Avg Watch Time</span>
            <span className="text-lg font-heading font-extrabold text-white">{insights.avgWatchTime}</span>
            <span className="text-[9px] text-success font-bold block mt-0.5">↑ 8% vs last week</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-5 border border-white/5 flex items-center gap-4 hover:border-primary/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Engagement Score</span>
            <span className="text-lg font-heading font-extrabold text-white">{insights.engagementScore}%</span>
            <span className="text-[9px] text-success font-bold block mt-0.5">↑ 12% vs benchmark</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-5 border border-white/5 flex items-center gap-4 hover:border-primary/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-warning flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Drop-off point</span>
            <span className="text-lg font-heading font-extrabold text-white">{insights.dropoffPoint}</span>
            <span className="text-[9px] text-red-400 font-bold block mt-0.5">↓ 5% loop decay</span>
          </div>
        </div>
      </div>

      {/* Grid: Retention Curve and segment details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Retention Line Chart (2/3 width) */}
        <div className="lg:col-span-2 glass-card p-6 border border-white/5 space-y-4">
          <div>
            <h3 className="text-sm font-heading font-bold text-white">Audience Retention Curve</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Percentage of listeners active across show duration</p>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={insights.retentionCurve} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#8888AA" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#8888AA" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="url(#retentionGrad)" 
                  strokeWidth={3.5} 
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <defs>
                  <linearGradient id="retentionGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7B5EFF" />
                    <stop offset="100%" stopColor="#FF5E9C" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Devices breakdown (1/3 width) */}
        <div className="glass-card p-6 border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-heading font-bold text-white">Device Breakdown</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Active user listening clients</p>
          </div>

          <div className="w-full h-40 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={insights.devices}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {insights.devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Laptop className="w-4 h-4 text-text-muted mb-0.5" />
              <span className="text-[10px] text-text-muted font-bold uppercase">Clients</span>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            {insights.devices.map((dev, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dev.color }} />
                  <span className="text-slate-300">{dev.name}</span>
                </div>
                <span className="text-white font-bold">{dev.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row: Geographic & Sortable Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Geo Distribution (1/3 width) */}
        <div className="glass-card p-6 border border-white/5 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-heading font-bold text-white flex items-center gap-1.5">
              <Globe className="w-4.5 h-4.5 text-primary" />
              <span>Geographic Distribution</span>
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5">Top listener markets</p>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto pr-1 scrollbar-none">
            {insights.geography.map((geo, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{geo.country}</span>
                  <span className="text-white font-bold">{geo.listens} listens ({geo.share}%)</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" 
                    style={{ width: `${geo.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sortable Table (2/3 width) */}
        <div className="lg:col-span-2 glass-card p-6 border border-white/5 space-y-4 flex flex-col">
          <h3 className="text-sm font-heading font-bold text-white">Top Performing Episodes</h3>
          <div className="overflow-x-auto flex-1 min-h-[220px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-text-muted font-bold text-[10px] uppercase">
                  <th className="py-3 px-2">Episode Title</th>
                  <th className="py-3 px-2 cursor-pointer hover:text-white" onClick={() => toggleSort("plays")}>
                    <div className="flex items-center gap-1.5">
                      <span>Total Plays</span>
                      <ArrowUpDown className="w-3 h-3 text-text-muted" />
                    </div>
                  </th>
                  <th className="py-3 px-2 cursor-pointer hover:text-white" onClick={() => toggleSort("likes")}>
                    <div className="flex items-center gap-1.5">
                      <span>Total Likes</span>
                      <ArrowUpDown className="w-3 h-3 text-text-muted" />
                    </div>
                  </th>
                  <th className="py-3 px-2">Duration</th>
                  <th className="py-3 px-2">Upload Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedEpisodes.map((ep) => (
                  <tr key={ep.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all">
                    <td className="py-3.5 px-2 font-bold text-white">{ep.title}</td>
                    <td className="py-3.5 px-2 font-mono text-slate-300 font-semibold">{ep.plays}</td>
                    <td className="py-3.5 px-2 font-mono text-slate-300 font-semibold">{ep.likes}</td>
                    <td className="py-3.5 px-2 font-mono text-text-muted">{ep.duration}</td>
                    <td className="py-3.5 px-2 text-text-muted">{ep.uploadDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
