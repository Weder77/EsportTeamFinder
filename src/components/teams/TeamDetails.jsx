import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Crown, Gamepad2, Sparkles, Trophy, Users as UsersIcon } from "lucide-react";
import SectionTitle from "../common/SectionTitle";
import GameFilter from "./GameFilter";
import TrophyGrid from "../trophies/TrophyGrid";
import { neon } from "../../utils/style";
import fallbackLogo from "../../assets/logo.png";
import PlayerCard from "../players/PlayerCard";
import PlayerModal from "../players/PlayerModal";
import { useTeamPlayers } from "../../hooks/useTeamPlayers";
import { countryCodeToEmoji } from "../../utils/flags";

export default function TeamDetails({ team, selectedGame, onChangeGame, onSelectTrophy }) {
  const activeTrophies = useMemo(() => {
    if (!team) return [];
    const trophies = team.trophies || [];
    return selectedGame ? trophies.filter((tr) => tr.game === selectedGame) : trophies;
  }, [team, selectedGame]);

  const { data: loadedPlayers, loading: playersLoading } = useTeamPlayers(team?.id, { perPage: 50 });
  const teamRoster = team?.players || [];
  const players = (loadedPlayers && loadedPlayers.length ? loadedPlayers : teamRoster);
  const [playerDetail, setPlayerDetail] = React.useState(null);

  const availableGames = useMemo(() => {
    const set = new Set();
    for (const p of players) if (p.game) set.add(p.game);
    const list = Array.from(set).sort();
    return list.length ? list : (team?.games || []);
  }, [players, team]);

  if (!team) {
    return (
      <div className="h-72 grid place-items-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03]">
        <Sparkles className="w-8 h-8 mb-3 text-white/50" />
        <h2 className="text-xl font-semibold">Choisis une équipe</h2>
      </div>
    );
  }

  return (
    <>
      {/* Team banner */}
      <div
        className="p-5 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent"
        style={neon(team.accent)}
      >
        <div className="flex items-start gap-4">
          <img
            src={team.logo || fallbackLogo}
            alt={team.name}
            className="w-16 h-16 rounded-xl bg-black/40 p-2 object-contain"
            onError={(e) => {
              if (e.currentTarget.src !== fallbackLogo) {
                e.currentTarget.src = fallbackLogo;
              }
            }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold">{team.name}</h2>
              <span className="px-2 py-1 text-xs rounded-full border border-white/10 bg-white/5">
                {team.short}
              </span>
              <span className="px-2 py-1 text-xs rounded-full border border-white/10 bg-white/5 inline-flex items-center gap-1">
                {team.country ? <span>{countryCodeToEmoji(team.country)}</span> : null}
                <span>{team.country}</span>
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/70">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Créée en {team.founded ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Crown className="w-4 h-4" />
                CEO{(team.ceos?.length || 0) > 1 ? "s" : ""}: {team.ceos?.join(" • ") ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trophies */}
      <SectionTitle icon={Trophy}>Trophées</SectionTitle>
      <TrophyGrid trophies={activeTrophies} onSelect={onSelectTrophy} />

      {/* Games */}
      <SectionTitle icon={Gamepad2}>Jeux</SectionTitle>
      <GameFilter games={availableGames} selected={selectedGame} onChange={onChangeGame} />

      {/* Players (roster from team response) */}
      <SectionTitle icon={UsersIcon}>Joueurs</SectionTitle>
      {players.length === 0 && (
        <div className="text-sm text-white/60">Aucun joueur trouvé pour cette équipe.</div>
      )}
      <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence>
          {players
            .filter((p) => !selectedGame || ((p.game || "").toLowerCase() === selectedGame.toLowerCase()))
            .map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <PlayerCard player={p} onClick={(pl) => setPlayerDetail(pl.slug || pl.id)} />
              </motion.div>
            ))}
        </AnimatePresence>
      </motion.div>
      {playersLoading && <div className="text-xs text-white/50">Chargement des joueurs…</div>}
      <PlayerModal idOrSlug={playerDetail} onClose={() => setPlayerDetail(null)} />
    </>
  );
}
