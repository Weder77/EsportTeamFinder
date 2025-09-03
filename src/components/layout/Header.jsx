import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Search } from "lucide-react";
import { usePlayerSearch } from "../../hooks/usePlayerSearch";
import { countryCodeToEmoji } from "../../utils/flags";
import PlayerModal from "../players/PlayerModal";
import logo from "../../assets/logo.png";

export default function Header({ query, onChange, hideSearch = false }) {
  const { query: playerQ, setQuery: setPlayerQ, results: playerResults, loading: loadingPlayers } = usePlayerSearch("");
  const [playerModal, setPlayerModal] = useState(null);
  return (
    <header className="border-b border-white/10 sticky top-0 z-20 backdrop-blur bg-[#0b0b0f]/80">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
        <Link to="/" className="text-2xl font-black tracking-tight brand-neon">
          <span className="text-white">CS2</span>
          <span className="text-fuchsia-400"> Team Finder</span>
        </Link>

        <nav className="flex items-center gap-3 ml-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `neon-tab ${isActive ? 'is-active' : ''}`}
          >
            Teams
          </NavLink>
          <NavLink
            to="/matches"
            className={({ isActive }) => `neon-tab ${isActive ? 'is-active' : ''}`}
          >
            Matchs
          </NavLink>
          <NavLink
            to="/leagues"
            className={({ isActive }) => `neon-tab ${isActive ? 'is-active' : ''}`}
          >
            Tournois
          </NavLink>
          <NavLink
            to="/bet"
            className={({ isActive }) => `neon-tab ${isActive ? 'is-active' : ''}`}
          >
            Bet
          </NavLink>
        </nav>

        {!hideSearch && (
          <div className="w-full max-w-2xl ml-auto grid md:grid-cols-2 gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                value={query}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder="Rechercher dans la page"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-fuchsia-400/60"
              />
            </div>
            <div className="relative">
              <input
                value={playerQ}
                onChange={(e) => setPlayerQ(e.target.value)}
                placeholder="Rechercher un joueur (min. 3 lettres)"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-fuchsia-400/60"
              />
              {playerQ && playerQ.length >= 3 && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl border border-white/10 bg-[#111115] max-h-64 overflow-auto shadow-[0_0_10px_rgba(168,85,247,0.25)] z-30">
                  {loadingPlayers && <div className="px-3 py-2 text-xs text-white/60">Recherche…</div>}
                  {!loadingPlayers && (playerResults || []).length === 0 && (
                    <div className="px-3 py-2 text-xs text-white/40">Aucun joueur</div>
                  )}
                  {(playerResults || []).map((pl) => (
                    <button
                      key={pl.id || pl.slug}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
                      onClick={() => { setPlayerModal(pl.id || pl.slug); }}
                    >
                      <img src={pl.image_url || logo} alt={pl.name} className="w-6 h-6 rounded bg-black/40 object-contain" />
                      <span className="truncate text-sm flex-1 min-w-0 flex items-center gap-1">
                        <span className="truncate">{pl.name}</span>
                        {pl.nationality ? (
                          <span className="text-[11px] text-white/70 inline-flex items-center gap-1 shrink-0">
                            <span>{countryCodeToEmoji(pl.nationality)}</span>
                            <span>{pl.nationality}</span>
                          </span>
                        ) : null}
                      </span>
                      {(pl.current_videogame?.name || pl.current_team) && (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs text-white/70 px-1.5 py-0.5 rounded-md border border-white/10 bg-white/5">
                          {pl.current_team?.image_url ? (
                            <img src={pl.current_team.image_url} alt={pl.current_team?.acronym || pl.current_team?.name || 'team'} className="w-4 h-4 rounded bg-black/40 object-contain" />
                          ) : null}
                          <span className="truncate max-w-[120px]">
                            {pl.current_videogame?.name || '—'}
                          </span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <PlayerModal idOrSlug={playerModal} onClose={() => setPlayerModal(null)} />
    </header>
  );
}
