import React from "react";
import fallbackLogo from "../../assets/logo.png";
import { countryCodeToEmoji } from "../../utils/flags";

export default function PlayerCard({ player, onClick }) {
  return (
    <button onClick={() => onClick?.(player)} className="text-left w-full p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center gap-3">
      <img
        src={player.image || fallbackLogo}
        alt={player.name}
        className="w-10 h-10 rounded-lg object-cover bg-black/40"
        onError={(e) => {
          if (e.currentTarget.src !== fallbackLogo) e.currentTarget.src = fallbackLogo;
        }}
      />
      <div className="min-w-0">
        <div className="font-medium truncate">{player.name}</div>
        <div className="text-xs text-white/60 flex items-center gap-1">
          {player.nationality ? (
            <span className="mr-1">{countryCodeToEmoji(player.nationality)}</span>
          ) : null}
          <span>{player.nationality || "—"}</span>
        </div>
        {player.game && (
          <div className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded border border-white/10 bg-white/5">
            {player.game}
          </div>
        )}
      </div>
    </button>
  );
}
