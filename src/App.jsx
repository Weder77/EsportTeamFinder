import React, { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import Header from "./components/layout/Header";
import SectionTitle from "./components/common/SectionTitle";
import Pagination from "./components/common/Pagination";
import TeamList from "./components/teams/TeamList";
import TeamDetails from "./components/teams/TeamDetails";
import TrophyModal from "./components/trophies/TrophyModal";
import { useTeams } from "./hooks/useTeams";
import { useTopTeams } from "./hooks/useTopTeams";
import { useTierSelection } from "./hooks/useTierSelection";
import Spinner from "./components/common/Spinner";

export default function EsportsTeamsExplorer() {
  const [query, setQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [trophyDetail, setTrophyDetail] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const { tiers, toggle, setTiers } = useTierSelection([]);

  // Fetch teams from PandaScore
  const { data: teams, loading, error, pageInfo } = useTeams({ page, perPage: PER_PAGE, search: query });
  const { data: topTeams, loading: loadingTop } = useTopTeams({ tiers, kinds: ['running','past'], pages: 2, perPage: 50 });
  const sTeams = useMemo(() => (topTeams || []).map(it => it.team).filter(Boolean), [topTeams]);
  const usingTierFilter = (tiers && tiers.length > 0);
  const listToShow = usingTierFilter ? sTeams : teams;

  // Local pagination when tier filter is active (client-side slice)
  const localTotal = listToShow.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotal / PER_PAGE));
  const pagedList = usingTierFilter ? listToShow.slice((page - 1) * PER_PAGE, (page - 1) * PER_PAGE + PER_PAGE) : listToShow;

  // Reset page when search query changes
  useEffect(() => { setPage(1); }, [query]);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-gray-100">
      <Header query={query} onChange={setQuery} />

      <main className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        {/* Teams */}
        <aside className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle icon={Users}>Équipes</SectionTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70">Tiers:</span>
              {['s','a','b'].map((t) => (
                <button
                  key={t}
                  onClick={() => { toggle(t); setSelectedTeam(null); setPage(1); }}
                  className={`px-2 py-0.5 rounded-lg border text-xs ${tiers.includes(t) ? 'border-fuchsia-500/70 bg-fuchsia-600/25 text-white shadow-[0_0_10px_rgba(168,85,247,0.6),0_0_22px_rgba(168,85,247,0.35)]' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'}`}
                >{t.toUpperCase()}</button>
              ))}
              {tiers.length > 0 && (
                <button onClick={() => { setTiers([]); setSelectedTeam(null); setPage(1); }} className="ml-1 text-[11px] text-white/60 hover:text-white">Reset</button>
              )}
            </div>
          </div>
          {error && <div className="text-sm text-rose-400">error, contact admin</div>}
          {!error && listToShow.length === 0 && !loading && !loadingTop && (
            <div className="text-sm text-white/50">No teams found.</div>
          )}
          <TeamList
            teams={pagedList}
            selectedTeamId={selectedTeam?.id}
            onSelect={(team) => {
              setSelectedTeam(team);
              setSelectedGame(null);
            }}
          />
          {(loading || loadingTop) && (
            <div className="py-2 flex justify-center">
              <Spinner size={24} />
            </div>
          )}
          <Pagination
            page={usingTierFilter ? page : (pageInfo?.page || page)}
            totalPages={usingTierFilter ? localTotalPages : (pageInfo?.totalPages || 1)}
            hasPrev={usingTierFilter ? page > 1 : !!pageInfo?.hasPrev}
            hasNext={usingTierFilter ? page < localTotalPages : !!pageInfo?.hasNext}
            onChange={(newPage) => setPage(newPage)}
          />
        </aside>

        {/* Details */}
        <section className="lg:col-span-2 space-y-6">
          <TeamDetails
            team={selectedTeam}
            selectedGame={selectedGame}
            onChangeGame={setSelectedGame}
            onSelectTrophy={setTrophyDetail}
          />
        </section>
      </main>

      {/* Trophy Modal */}
      <TrophyModal trophy={trophyDetail} onClose={() => setTrophyDetail(null)} />
    </div>
  );
}
