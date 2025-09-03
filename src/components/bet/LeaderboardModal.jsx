import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trophy } from "lucide-react";

export default function LeaderboardModal({ open, onClose, items = [] }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="max-w-lg w-full bg-[#0b0b0f] border border-white/10 rounded-2xl p-6 relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-6 h-6 text-fuchsia-400" />
              <h3 className="text-lg font-bold">Classement</h3>
            </div>
            <div className="space-y-2">
              {items.length === 0 && (
                <div className="text-sm text-white/60">Aucun score pour l'instant.</div>
              )}
              {items.map((it, idx) => (
                <div key={it.name} className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white/60 w-6">{idx + 1}.</span>
                    <span className="font-medium truncate">{it.name}</span>
                  </div>
                  <div className="text-white/90 font-semibold">{it.points} pts</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

