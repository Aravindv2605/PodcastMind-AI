import React from "react";
import { PodcastProvider, usePodcast } from "./context/PodcastContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import MyPodcastsPage from "./pages/MyPodcastsPage";
import AiHostTwinPage from "./pages/AiHostTwinPage";
import ChatWithPodcastPage from "./pages/ChatWithPodcastPage";
import ViralClipsPage from "./pages/ViralClipsPage";
import KnowledgeHubPage from "./pages/KnowledgeHubPage";
import EmotionTimelinePage from "./pages/EmotionTimelinePage";
import AudienceInsightsPage from "./pages/AudienceInsightsPage";
import SettingsPage from "./pages/SettingsPage";
import SearchPodcastsPage from "./pages/SearchPodcastsPage";
import UpgradeModal from "./components/UpgradeModal";
import ApiConfigModal from "./components/ApiConfigModal";
import Toast from "./components/Toast";
import { AnimatePresence } from "framer-motion";

function AppContent() {
  const { activePage, setActivePage } = usePodcast();

  React.useEffect(() => {
    if (localStorage.getItem('podcastmind_upload_on_init') === 'true') {
      setActivePage("my-podcasts");
    }
  }, [setActivePage]);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard key="dashboard" />;
      case "my-podcasts":
        return <MyPodcastsPage key="my-podcasts" />;
      case "search-podcasts":
        return <SearchPodcastsPage key="search-podcasts" />;
      case "ai-host-twin":
        return <AiHostTwinPage key="ai-host-twin" />;
      case "chat-with-podcast":
        return <ChatWithPodcastPage key="chat-with-podcast" />;

      case "viral-clips":
        return <ViralClipsPage key="viral-clips" />;
      case "knowledge-hub":
        return <KnowledgeHubPage key="knowledge-hub" />;
      case "emotion-timeline":
        return <EmotionTimelinePage key="emotion-timeline" />;
      case "audience-insights":
        return <AudienceInsightsPage key="audience-insights" />;

      case "settings":
        return <SettingsPage key="settings" />;
      default:
        return <Dashboard key="dashboard" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans flex overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic Page Views Wrapper */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            {renderPage()}
          </AnimatePresence>
        </main>
      </div>

      {/* Global Modals and Toast UI */}
      <UpgradeModal />
      <ApiConfigModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <PodcastProvider>
      <AppContent />
    </PodcastProvider>
  );
}
