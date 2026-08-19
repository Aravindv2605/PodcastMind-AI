import React, { useState, useRef } from "react";
import { usePodcast } from "../context/PodcastContext";
import { motion } from "framer-motion";
import { User, Bell, Cpu, Globe2, Link2, HardDrive, CreditCard, Trash2, ShieldAlert, Sparkles, Check } from "lucide-react";

export default function SettingsPage() {
  const { setIsApiConfigModalOpen, avatar, setAvatar, showToast } = usePodcast();
  const sessionData = localStorage.getItem("podcastmind_session");
  const session = sessionData ? JSON.parse(sessionData) : { name: "Aravindhan", email: "aravindhan@example.com" };
  const [name, setName] = useState(session.name || "Aravindhan");
  const [email, setEmail] = useState(session.email || "aravindhan@example.com");
  const [bio, setBio] = useState("AI Researcher & Technology Creator");

  const fileInputRef = useRef(null);

  const handleEditAvatar = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Limit size to 1.5MB to stay safe under 5MB localStorage limit
      if (file.size > 1.5 * 1024 * 1024) {
        showToast("Please upload an image smaller than 1.5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setAvatar(uploadEvent.target.result);
        showToast("Profile photo updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Models
  const [aiModel, setAiModel] = useState("Gemini 2.5 Pro");
  
  // Toggles
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [notifClips, setNotifClips] = useState(true);



  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto lg:ml-64 ml-0 min-h-screen pb-16"
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white">Welcome, {name}</h2>
          <p className="text-xs text-text-muted mt-1 font-medium">Email: {email}</p>
        </div>
      </div>

      {/* 1. Profile Section */}
      <div className="glass-card p-6 border border-white/5 space-y-4">
        <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
          <User className="w-4.5 h-4.5 text-primary" />
          <span>Creator Profile</span>
        </h3>
        
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative group">
            <input 
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <img
              src={avatar}
              alt="Avatar"
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary/45 cursor-pointer"
              onClick={handleEditAvatar}
            />
            <div 
              onClick={handleEditAvatar}
              className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
            >
              <span className="text-[10px] text-white font-bold">Edit</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Bio Tagline</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-xs py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Notification Preferences */}
      <div className="glass-card p-6 border border-white/5 space-y-4">
        <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
          <Bell className="w-4.5 h-4.5 text-primary" />
          <span>Notification Preferences</span>
        </h3>
        
        <div className="space-y-3.5">
          {[
            { label: "Email Notifications", desc: "Receive weekly audience retention reports and performance stats.", checked: notifEmail, set: setNotifEmail },
            { label: "Browser Push Alerts", desc: "Get real-time updates when AI finishes slicing viral clips.", checked: notifPush, set: setNotifPush },
            { label: "Viral clips ready", desc: "Send an alert when viral scores exceed 90%.", checked: notifClips, set: setNotifClips }
          ].map((toggle, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 border-b border-white/[0.02] last:border-0 pb-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">{toggle.label}</p>
                <p className="text-[10px] text-text-muted">{toggle.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={toggle.checked}
                onChange={(e) => toggle.set(e.target.checked)}
                className="w-4.5 h-4.5 accent-primary rounded cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. AI Model Settings */}
      <div className="glass-card p-6 border border-white/5 space-y-4">
        <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
          <Cpu className="w-4.5 h-4.5 text-primary" />
          <span>AI Model Routing Configuration</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Primary Reasoning Engine</label>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full text-xs py-3 px-4 rounded-xl bg-[#13131A] border border-white/5 text-white outline-none focus:border-primary/45 cursor-pointer"
            >
              <option value="Gemini 2.5 Pro">Gemini 2.5 Pro (Recommended)</option>
              <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
              <option value="GPT-4o">GPT-4o</option>
            </select>
            <span className="text-[9px] text-text-muted block">Runs heavy cognitive processes, perspective analysis, and summary generation.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Transcription Language</label>
            <select
              className="w-full text-xs py-3 px-4 rounded-xl bg-[#13131A] border border-white/5 text-white outline-none focus:border-primary/45 cursor-pointer"
            >
              <option value="en">English (US)</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
              <option value="fr">French</option>
            </select>
            <span className="text-[9px] text-text-muted block">Default Whisper translation codec target.</span>
          </div>
        </div>
      </div>

      {/* 4. API Integrations */}
      <div className="glass-card p-6 border border-white/5 space-y-4">
        <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
          <Link2 className="w-4.5 h-4.5 text-primary" />
          <span>API & Podcast Feed Integrations</span>
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {[
            { name: "Spotify Sync", status: "Connected", desc: "Auto-pull Spotify episodes", btn: "Configure", active: true },
            { name: "YouTube RSS", status: "Connected", desc: "Auto-ingest video feeds", btn: "Configure", active: true },
            { name: "Libsyn Feed", status: "Disconnected", desc: "Connect manual RSS stream", btn: "Connect" }
          ].map((int, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-32">
              <div>
                <span className="text-xs font-bold text-white block">{int.name}</span>
                <span className="text-[10px] text-text-muted mt-1 block leading-tight">{int.desc}</span>
              </div>
              <div className="flex justify-between items-center mt-2.5">
                <span className={`text-[9px] font-bold ${int.active ? "text-success" : "text-text-muted"}`}>
                  {int.status}
                </span>
                <button 
                  onClick={() => setIsApiConfigModalOpen(true)}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                >
                  {int.btn}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* 6. Danger Zone */}
      <div className="p-6 rounded-2xl border border-red-500/10 bg-red-500/[0.01] space-y-4">
        <h3 className="text-sm font-heading font-bold text-red-400 flex items-center gap-2">
          <ShieldAlert className="w-4.5 h-4.5 text-red-500" />
          <span>Danger Zone</span>
        </h3>
        
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-xs font-bold text-white">Delete Creator Account</p>
            <p className="text-[10px] text-text-muted">Permanently delete your account, files, transcription datasets, and settings. This cannot be undone.</p>
          </div>
          <button 
            onClick={() => {
              const confirmed = window.confirm("Are you absolutely sure you want to delete your creator account? All files, clips, and integrations will be deleted permanently. This cannot be undone.");
              if (confirmed) {
                localStorage.removeItem('podcastmind_session');
                window.location.href = 'login.html';
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all cursor-pointer"
          >
            Delete Account
          </button>
        </div>
      </div>

    </motion.div>
  );
}
