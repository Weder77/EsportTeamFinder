import React from "react";
import { Search } from "lucide-react";

export default function Header({ query, onChange }) {
  return (
    <header className="border-b border-white/10 sticky top-0 z-20 backdrop-blur bg-[#0b0b0f]/80">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
        <div className="text-2xl font-black tracking-tight">
          <span className="text-white">ES</span>
          <span className="text-fuchsia-400">Watch</span>
        </div>
        <div className="relative w-full max-w-xl ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            value={query}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Rechercher une équipe"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-fuchsia-400/60"
          />
        </div>
      </div>
    </header>
  );
}

