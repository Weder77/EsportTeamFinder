import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { neon } from "../../utils/style";
import fallbackLogo from "../../assets/logo.png";
import { countryCodeToEmoji } from "../../utils/flags";

export default function TeamCard({ team, selected, onSelect }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect?.(team)}
      className={`group flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/5 text-left transition ${
        selected ? "ring-1 ring-fuchsia-500/40" : ""
      }`}
      style={selected ? neon(team.accent) : {}}
    >
      <img
        src={team.image_url || team.logo || fallbackLogo}
        alt={team.name || team.slug}
        className="w-10 h-10 rounded-lg object-contain bg-black/40 p-1"
        onError={(e) => {
          if (e.currentTarget.src !== fallbackLogo) {
            e.currentTarget.src = fallbackLogo;
          }
        }}
      />
      <div className="flex-1">
        <h3 className="font-semibold">{team.name || team.slug}</h3>
        <div className="text-xs text-white/60 flex items-center gap-1">
          {team.country || team.location ? (
            <span className="mr-1">{countryCodeToEmoji((team.country || team.location) || '')}</span>
          ) : null}
          <span>{team.country || team.location}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70" />
    </motion.button>
  );
}
