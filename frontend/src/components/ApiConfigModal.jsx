import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Key, Info, RefreshCw } from "lucide-react";
import { usePodcast } from "../context/PodcastContext";

export default function ApiConfigModal() {
  const { isApiConfigModalOpen, setIsApiConfigModalOpen, apiConfig, setApiConfig, showToast } = usePodcast();
  const [spotifyKey, setSpotifyKey] = useState("");
  const [youtubeKey, setYoutubeKey] = useState("");
  const [libsynKey, setLibsynKey] = useState("");
  
  // Connect toggles
  const [spotifyConn, setSpotifyConn] = useState(true);
  const [youtubeConn, setYoutubeConn] = useState(true);
  const [libsynConn, setLibsynConn] = useState(false);

  useEffect(() => {
    if (apiConfig) {
      setSpotifyKey(apiConfig.spotify.apiKey);
      setYoutubeKey(apiConfig.youtube.apiKey);
      setLibsynKey(apiConfig.libsyn.apiKey);
      setSpotifyConn(apiConfig.spotify.connected);
      setYoutubeConn(apiConfig.youtube.connected);
      setLibsynConn(apiConfig.libsyn.connected);
    }
  }, [apiConfig, isApiConfigModalOpen]);

  const handleSave = (e) => {
    e.preventDefault();
    setApiConfig({
      spotify: { connected: spotifyConn, apiKey: spotifyKey },
      youtube: { connected: youtubeConn, apiKey: youtubeKey },
      libsyn: { connected: libsynConn, apiKey: libsynKey }
    });
    showToast("API Integration configuration saved successfully!");
    setIsApiConfigModalOpen(false);
  };

  return (
    <AnimatePresence>
      {isApiConfigModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg bg-[#13131A] border border-white/10 rounded-3xl p-6 relative shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsApiConfigModalOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5">
              <div className="flex items-center gap-2">
                <Link2 className="w-4.5 h-4.5 text-primary" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary uppercase">
                  Feed Integrations
                </span>
              </div>
              <h3 className="text-lg font-heading font-bold text-white mt-1.5">
                Configure API & RSS Feeds
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Connect external catalogs to automatically sync newly released show metadata.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Spotify Sync */}
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">Spotify Creator Sync</h4>
                    <p className="text-[10px] text-text-muted mt-0.5">Sync catalogs with Spotify dashboard</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={spotifyConn}
                    onChange={(e) => setSpotifyConn(e.target.checked)}
                    className="w-4.5 h-4.5 accent-primary rounded cursor-pointer"
                  />
                </div>
                {spotifyConn && (
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={spotifyKey}
                      onChange={(e) => setSpotifyKey(e.target.value)}
                      placeholder="Enter Spotify Client Secret"
                      className="w-full text-[11px] py-2 pl-9 pr-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* YouTube RSS */}
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">YouTube RSS Ingest</h4>
                    <p className="text-[10px] text-text-muted mt-0.5">Parse live video podcasts feeds</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={youtubeConn}
                    onChange={(e) => setYoutubeConn(e.target.checked)}
                    className="w-4.5 h-4.5 accent-primary rounded cursor-pointer"
                  />
                </div>
                {youtubeConn && (
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={youtubeKey}
                      onChange={(e) => setYoutubeKey(e.target.value)}
                      placeholder="Enter Google API Ingestion Key"
                      className="w-full text-[11px] py-2 pl-9 pr-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Libsyn RSS Feed */}
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">Libsyn Live Stream RSS</h4>
                    <p className="text-[10px] text-text-muted mt-0.5">Connect custom XML metadata feeds</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={libsynConn}
                    onChange={(e) => setLibsynConn(e.target.checked)}
                    className="w-4.5 h-4.5 accent-primary rounded cursor-pointer"
                  />
                </div>
                {libsynConn && (
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={libsynKey}
                      onChange={(e) => setLibsynKey(e.target.value)}
                      placeholder="https://feed.libsyn.com/rss/show-name"
                      className="w-full text-[11px] py-2 pl-9 pr-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Info alert */}
              <div className="flex gap-2 items-center text-[10px] text-text-muted bg-white/[0.01] p-2.5 rounded-xl border border-white/5">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span>Simulated sync is local only and credentials are not routed externally.</span>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs transition-all cursor-pointer shadow-neon-purple hover:opacity-95 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
