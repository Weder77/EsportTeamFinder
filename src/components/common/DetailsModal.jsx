import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function DetailsModal({ open, onClose, title, subtitle, imageUrl, items = [] }) {
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
            className="max-w-xl w-full bg-[#0b0b0f] border border-white/10 rounded-2xl p-6 relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              {imageUrl ? (
                <img src={imageUrl} alt={title} className="w-10 h-10 rounded bg-black/40 object-contain" />
              ) : null}
              <div className="min-w-0">
                <h3 className="text-xl font-bold truncate">{title}</h3>
                {subtitle ? <div className="text-sm text-white/60 truncate">{subtitle}</div> : null}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {items.filter(Boolean).map(([label, value]) => (
                value ? (
                  <div key={label} className="flex items-center gap-2 min-w-0">
                    <div className="text-white/50 w-32 shrink-0">{label}</div>
                    <div className="truncate">{String(value)}</div>
                  </div>
                ) : null
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

