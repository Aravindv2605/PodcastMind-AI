import React, { useState, useEffect, useRef } from "react";
import { usePodcast } from "../context/PodcastContext";
import { Search, Star, Bell, ChevronDown, Sparkles, LogOut, User, Key, HelpCircle, Menu } from "lucide-react";

export default function Navbar() {
  const { 
    searchQuery, 
    setSearchQuery, 
    activePage, 
    setActivePage,
    setIsUpgradeModalOpen,
    userRole,
    avatar,
    setIsSidebarOpen
  } = usePodcast();
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "AI Host Twin model update completed.", time: "2h ago", unread: true },
    { id: 2, text: "Viral clips generated for Episode 1.", time: "5h ago", unread: true },
    { id: 3, text: "Weekly Audience Insights report ready.", time: "1d ago", unread: false }
  ]);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Retrieve user session dynamically
  const sessionData = localStorage.getItem('podcastmind_session');
  const session = sessionData ? JSON.parse(sessionData) : { name: "Sarah Chen", email: "sarah.chen@podcastmind.ai", role: "Creator" };

  const handleLogout = () => {
    localStorage.removeItem('podcastmind_session');
    window.location.href = 'login.html';
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <header className="h-20 bg-background/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 lg:ml-64 ml-0">
      {/* Left items: Menu (on mobile) and Search */}
      <div className="flex items-center gap-3 flex-1 max-w-[200px] sm:max-w-md">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-2.5 rounded-xl bg-[#13131A] border border-white/5 text-text-muted hover:text-white transition-colors cursor-pointer shrink-0"
          title="Open Menu"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        {/* Search Input Bar */}
        <div className="w-full relative group">
          <Search className="w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // If the user starts searching, it's nice to keep them on dashboard or my-podcasts to see filtered items
              if (activePage !== "dashboard" && activePage !== "my-podcasts") {
                setActivePage("my-podcasts");
              }
            }}
            placeholder="Search podcasts, topics..."
            className="w-full text-xs py-2.5 pl-11 pr-12 rounded-xl bg-[#13131A] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all focus:ring-1 focus:ring-primary/20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-text-muted select-none hidden sm:flex items-center gap-0.5">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Right Side */}
      <div className="flex items-center gap-5">
        {/* Upgrade Button */}
        <button 
          onClick={() => setIsUpgradeModalOpen(true)}
          className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-xs transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-neon-purple"
        >
          <Star className="w-3.5 h-3.5 fill-white" />
          <span>{userRole === "Creator" ? "Upgrade to Pro" : "Manage Plan"}</span>
        </button>

        {/* Notifications Icon with menu */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-xl bg-[#13131A] border border-white/5 text-text-muted hover:text-white transition-colors relative cursor-pointer ${
              showNotifications ? "text-white border-white/10" : ""
            }`}
          >
            <Bell className="w-4.5 h-4.5" />
            {notifications.some(n => n.unread) && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary ring-2 ring-background animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-[#13131A] border border-white/5 p-4 shadow-2xl z-50">
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <h4 className="text-xs font-semibold text-white">Notifications</h4>
                <button 
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-primary font-semibold hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
              </div>
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-slate-200 leading-normal">{notif.text}</p>
                      {notif.unread && <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1 shrink-0" />}
                    </div>
                    <span className="text-[9px] text-text-muted">{notif.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-white/10" />

        {/* User Profile Avatar Selector */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 p-1.5 pr-3.5 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer border border-transparent hover:border-white/5"
          >
            {/* User photo */}
            <img
              src={avatar}
              alt="User Avatar"
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-primary/30"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-white">{session.name}</p>
              <p className="text-[9px] text-text-muted capitalize">{userRole}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted transition-transform" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#13131A] border border-white/5 p-2 shadow-2xl z-50">
              <div className="px-3.5 py-2.5 border-b border-white/5">
                <p className="text-xs font-semibold text-white">{session.name}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{session.email}</p>
              </div>
              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => { setActivePage("settings"); setShowProfileDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-white hover:bg-white/[0.04] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile Settings</span>
                </button>
                <button
                  onClick={() => { setActivePage("settings"); setShowProfileDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-white hover:bg-white/[0.04] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>API Integration</span>
                </button>
                <button
                  onClick={() => { setShowProfileDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-white hover:bg-white/[0.04] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Help Center</span>
                </button>
                <div className="h-[1px] bg-white/5 my-1" />
                <button
                  onClick={() => { handleLogout(); setShowProfileDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
