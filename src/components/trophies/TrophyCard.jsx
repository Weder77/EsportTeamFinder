import React from "react";
import { motion } from "framer-motion";
import { Medal } from "lucide-react";

export default function TrophyCard({ trophy, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      onClick={() => onClick?.(trophy)}
      className="cursor-pointer p-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent"
    >
      <div className="flex items-center gap-2 mb-2">
        <Medal className="w-5 h-5" />
        <div className="font-semibold">{trophy.title}</div>
      </div>
      <div className="text-xs text-white/60">
        {trophy.game} • {trophy.year}
      </div>
    </motion.div>
  );
}

