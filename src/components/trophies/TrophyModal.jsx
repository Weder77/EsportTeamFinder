import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Medal, X } from "lucide-react";

export default function TrophyModal({ trophy, onClose }) {
  return (
    <AnimatePresence>
      {trophy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="max-w-lg w-full bg-[#0b0b0f] border border-white/10 rounded-2xl p-6 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <Medal className="w-7 h-7 text-fuchsia-400" />
              <h3 className="text-xl font-bold">{trophy.title}</h3>
            </div>
            <div className="text-sm text-white/60 mb-2">
              {trophy.game} • {trophy.year} • Tier {trophy.tier}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

