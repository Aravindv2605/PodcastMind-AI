import React, { useState, useEffect } from "react";
import { usePodcast } from "../context/PodcastContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Radio, Calendar, Heart, Share2, Play, Trash2, Edit3, BarChart3, Upload, X, FileAudio } from "lucide-react";

export default function MyPodcastsPage() {
  const { 
    podcasts, 
    uploadPodcast, 
    deletePodcast, 
    selectPodcast, 
    setActivePage, 
    searchQuery,
    updatePodcastDetails,
    showToast
  } = usePodcast();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editPodcastId, setEditPodcastId] = useState(null);

  const filteredPodcasts = podcasts.filter((pod) => {
    if (!pod.isUserUploaded) return false;
    if (!searchQuery || !searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      pod.category.toLowerCase().includes(query) ||
      pod.title.toLowerCase().includes(query) ||
      pod.host.toLowerCase().includes(query) ||
      pod.description.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    if (localStorage.getItem('podcastmind_upload_on_init') === 'true') {
      setShowUploadModal(true);
      localStorage.removeItem('podcastmind_upload_on_init');
    }
  }, []);

  // Upload Form States
  const [title, setTitle] = useState("");
  const [host, setHost] = useState("Alex Carter");
  const [category, setCategory] = useState("Technology");
  const [duration, setDuration] = useState("42:15");
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileObject, setFileObject] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      // Auto-extract title from file name
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(cleanTitle);
      setFileObject(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(cleanTitle);
      setFileObject(file);
    }
  };

  const handleOpenUploadModal = () => {
    setEditPodcastId(null);
    setTitle("");
    setHost("Alex Carter");
    setCategory("Technology");
    setDuration("42:15");
    setDescription("");
    setFileName("");
    setFileObject(null);
    setShowUploadModal(true);
  };

  const handleEditClick = (pod) => {
    setEditPodcastId(pod.id);
    setTitle(pod.title);
    setHost(pod.host);
    setCategory(pod.category);
    setDuration(pod.duration);
    setDescription(pod.description || "");
    setFileName("");
    setFileObject(null);
    setShowUploadModal(true);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editPodcastId) {
      updatePodcastDetails(editPodcastId, {
        title,
        host,
        category,
        description,
        duration
      });
      showToast("Podcast details updated successfully!");
    } else {
      let audioUrl = "";
      if (fileObject) {
        audioUrl = URL.createObjectURL(fileObject);
      }
      uploadPodcast(title, host, category, description, duration, null, audioUrl);
      showToast("Podcast uploaded and processed successfully!");
    }
    
    setShowUploadModal(false);
    
    // Clear states
    setTitle("");
    setDescription("");
    setFileName("");
    setFileObject(null);
    setEditPodcastId(null);
  };

  const handleAnalyzeClick = (pod) => {
    selectPodcast(pod);
    setActivePage("dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto lg:ml-64 ml-0 min-h-screen"
    >
      {/* Header row */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white">My Podcast Library</h2>
          <p className="text-xs text-text-muted mt-1 font-medium">Manage, analyze, and upload your voice show archives</p>
        </div>
        <button
          onClick={handleOpenUploadModal}
          className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-xs transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-neon-purple"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Podcast</span>
        </button>
      </div>

      {/* Grid of Podcasts */}
      {podcasts.filter((p) => p.isUserUploaded).length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center text-center p-12 border border-white/5 max-w-2xl mx-auto mt-16 rounded-3xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-neon-purple animate-pulse">
            <Radio className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-heading font-extrabold text-white">Your Creator Library is Empty</h3>
            <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
              You haven't uploaded any custom podcasts yet. Drag & drop or select your audio shows to instantly transcribe, analyze sentiments, and extract viral clips.
            </p>
          </div>
          <button
            onClick={handleOpenUploadModal}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-xs transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-neon-purple"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Your First Show</span>
          </button>
        </div>
      ) : filteredPodcasts.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center text-center p-12 border border-white/5 max-w-2xl mx-auto mt-16 rounded-3xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-white/5 text-text-muted flex items-center justify-center">
            <X className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Matching Uploads Found</h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              We couldn't find any uploaded podcasts matching "{searchQuery}". Try a different keyword or category.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPodcasts.map((pod) => (
            <div
              key={pod.id}
              className="glass-card overflow-hidden border border-white/5 flex flex-col justify-between group hover:border-primary/20 transition-all duration-300"
            >
              {/* Image overlay */}
              <div className="relative h-48 overflow-hidden shrink-0">
                <img
                  src={pod.thumbnail}
                  alt={pod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-black/10" />
                
                {/* Category Tag */}
                <span className="absolute top-4 left-4 text-[9px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                  {pod.category}
                </span>

                {/* Upload Date */}
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-[10px] text-slate-300 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <span>Uploaded: {pod.uploadDate}</span>
                </div>
              </div>

              {/* Body Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight group-hover:text-primary transition-colors leading-snug line-clamp-1">
                    {pod.title}
                  </h3>
                  <p className="text-[11px] text-text-muted mt-1.5 font-semibold">
                    Host: {pod.host} • {pod.episodesCount} Episodes
                  </p>
                  <p className="text-[11px] text-text-muted/80 mt-2.5 leading-relaxed line-clamp-2">
                    {pod.description}
                  </p>
                </div>

                {/* Stats & Actions */}
                <div className="mt-5 pt-4 border-t border-white/5">
                  {/* Stats */}
                  <div className="flex items-center justify-between text-[10px] font-bold text-text-muted mb-4 px-1">
                    <span className="flex items-center gap-1">
                      <Play className="w-3.5 h-3.5 fill-text-muted/10 text-text-muted" />
                      <span>{pod.plays} Plays</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-text-muted" />
                      <span>{pod.likes} Likes</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-text-muted" />
                      <span>{pod.shares} Shares</span>
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleAnalyzeClick(pod)}
                      className="py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Analyze</span>
                    </button>
                    <button 
                      onClick={() => handleEditClick(pod)}
                      className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => deletePodcast(pod.id)}
                      className="py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Upload Drag-and-Drop Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-[#13131A] border border-white/10 rounded-3xl p-6 relative shadow-2xl"
            >
              {/* Close */}
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute right-4 top-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary uppercase">
                  Add Show
                </span>
                <h3 className="text-lg font-heading font-bold text-white mt-1.5">
                  {editPodcastId ? "Edit Podcast Details" : "Upload Podcast Audio Archive"}
                </h3>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Drag and Drop Container */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all relative ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : fileName
                      ? "border-success/50 bg-success/5"
                      : "border-white/10 hover:border-white/20 bg-white/[0.01]"
                  }`}
                >
                  <input
                    type="file"
                    id="audio-upload"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  
                  {fileName ? (
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                        <FileAudio className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-white">{fileName}</p>
                      <p className="text-[10px] text-text-muted">Audio file loaded. Adjust details below.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-white">Drag & drop your podcast file here</p>
                      <p className="text-[10px] text-text-muted">or click to browse local files (MP3, WAV, M4A up to 150MB)</p>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Podcast Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter episode/podcast name"
                    className="w-full text-xs py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Host */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Host Name</label>
                    <input
                      type="text"
                      required
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      className="w-full text-xs py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white outline-none transition-all"
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Duration (MM:SS)</label>
                    <input
                      type="text"
                      required
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 45:30"
                      className="w-full text-xs py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs py-3 px-4 rounded-xl bg-[#13131A] border border-white/5 focus:border-primary/50 text-white outline-none transition-all"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Business">Business</option>
                      <option value="Philosophy">Philosophy</option>
                      <option value="Science">Science</option>
                      <option value="Education">Education</option>
                    </select>
                  </div>

                  {/* Submit Button inside row */}
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs transition-all cursor-pointer shadow-neon-purple hover:opacity-95"
                    >
                      {editPodcastId ? "Save Changes" : "Process & Transcribe"}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Description</label>
                  <textarea
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a brief summary of the conversation topic..."
                    className="w-full text-xs py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all resize-none"
                  />
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
