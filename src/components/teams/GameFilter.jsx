import React from "react";

export default function GameFilter({ games = [], selected, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange?.(null)}
        className={`px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-sm ${
          selected === null ? "ring-1 ring-fuchsia-500/40" : "hover:bg-white/10"
        }`}
      >
        Tous
      </button>
      {games.map((g) => (
        <button
          key={g}
          onClick={() => onChange?.(g)}
          className={`px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-sm ${
            selected === g ? "ring-1 ring-fuchsia-500/40" : "hover:bg-white/10"
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}

