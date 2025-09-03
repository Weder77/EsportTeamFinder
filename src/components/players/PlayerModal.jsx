import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { usePlayer } from "../../hooks/usePlayer";
import fallbackLogo from "../../assets/logo.png";
import { countryCodeToEmoji } from "../../utils/flags";

export default function PlayerModal({ idOrSlug, onClose }) {
  const { data, loading, error } = usePlayer(idOrSlug);

  const content = (
    <AnimatePresence>
      {idOrSlug && (
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
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            {loading && <div className="text-sm text-white/60">Chargement du joueur…</div>}
            {error && <div className="text-sm text-rose-400">Erreur de chargement.</div>}
            {!loading && !error && data && (
              <div className="flex items-start gap-4">
                <img
                  src={data.image_url || fallbackLogo}
                  alt={data.name}
                  className="w-16 h-16 rounded-lg object-cover bg-black/40"
                  onError={(e) => {
                    if (e.currentTarget.src !== fallbackLogo) e.currentTarget.src = fallbackLogo;
                  }}
                />
                <div className="flex-1">
                  <div className="text-xl font-bold truncate">{data.name}</div>
                  <div className="text-sm text-white/60 truncate">
                    {data.first_name || ""} {data.last_name || ""}
                  </div>
                  <div className="mt-2 text-sm text-white/70 flex items-center gap-2 flex-wrap">
                    {data.nationality && <span>{countryCodeToEmoji(data.nationality)}</span>}
                    {data.nationality}
                    {data.age ? <span>• {data.age} ans</span> : null}
                    {data.current_videogame?.name ? <span>• {data.current_videogame.name}</span> : null}
                  </div>

                  {data.current_team && (
                    <div className="mt-3 flex items-center gap-2">
                      <img
                        src={data.current_team.image_url || fallbackLogo}
                        alt={data.current_team.acronym || data.current_team.name}
                        className="w-6 h-6 rounded bg-black/40 object-contain"
                        onError={(e) => {
                          if (e.currentTarget.src !== fallbackLogo) e.currentTarget.src = fallbackLogo;
                        }}
                      />
                      <div className="text-sm font-medium truncate">
                        {data.current_team.name}
                      </div>
                      {data.current_team.acronym && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5">
                          {data.current_team.acronym}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render via portal to avoid being constrained by header/sticky contexts
  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
