import React from "react";
import { usePodcast } from "../context/PodcastContext";
import { Play, PlayCircle, Eye } from "lucide-react";

export default function RecentUploads() {
  const { episodes, podcasts, activeEpisode, selectEpisode, setActivePage } = usePodcast();

  // Filter out the currently active episode and only show user-uploaded shows
  const recents = episodes.filter((ep) => {
    const pod = podcasts.find((p) => p.id === ep.podcastId);
    return pod && pod.isUserUploaded && ep.id !== activeEpisode.id;
  }).slice(0, 4);

  return (
    <div className="w-full">
      {/* Title Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
          <span>Recent Uploads</span>
        </h3>
        <button 
          onClick={() => setActivePage("my-podcasts")}
          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Grid container */}
      {recents.length === 0 ? (
        <div className="p-4.5 rounded-2xl bg-[#13131A] border border-white/5 text-center text-xs text-text-muted font-medium">
          No recent uploads in your creator library. Click "View All" to upload one!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {recents.map((ep) => (
            <div
              key={ep.id}
              onClick={() => selectEpisode(ep)}
              className="p-3 rounded-2xl bg-[#13131A] hover:bg-white/[0.04] border border-white/5 transition-all flex items-center gap-3 cursor-pointer group hover:border-primary/20 shadow-lg"
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative">
                <img
                  src={ep.thumbnail}
                  alt={ep.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              </div>

              {/* Info details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                  {ep.title}
                </h4>
                <p className="text-[10px] text-text-muted mt-0.5 font-medium flex items-center gap-1.5">
                  <span>{ep.duration}</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-white/10" />
                  <span>Host: {ep.host}</span>
                </p>
              </div>
              
              {/* Mini play button */}
              <PlayCircle className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
