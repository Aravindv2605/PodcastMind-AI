import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X } from "lucide-react";
import { usePodcast } from "../context/PodcastContext";

export default function Toast() {
  const { toast } = usePodcast();

  return (
    <AnimatePresence>
      {toast?.show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-6 right-6 z-55 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#13131A]/90 backdrop-blur-xl border border-primary/30 shadow-[0_0_20px_rgba(123,94,255,0.15)] max-w-sm pointer-events-auto"
        >
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-white leading-normal pr-2">
            {toast.message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
