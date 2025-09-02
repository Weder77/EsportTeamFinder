import React, { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import Header from "./components/layout/Header";
import SectionTitle from "./components/common/SectionTitle";
import Pagination from "./components/common/Pagination";
import TeamList from "./components/teams/TeamList";
import TeamDetails from "./components/teams/TeamDetails";
import TrophyModal from "./components/trophies/TrophyModal";
import { useTeams } from "./hooks/useTeams";

export default function EsportsTeamsExplorer() {
  const [query, setQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [trophyDetail, setTrophyDetail] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  // Fetch teams from PandaScore
  const { data: teams, loading, error, pageInfo } = useTeams({ page, perPage: PER_PAGE, search: query });

  // Reset page when search query changes
  useEffect(() => { setPage(1); }, [query]);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-gray-100">
      <Header query={query} onChange={setQuery} />

      <main className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        {/* Teams */}
        <aside className="lg:col-span-1 space-y-3">
          <SectionTitle icon={Users}>Équipes</SectionTitle>
          {error && <div className="text-sm text-rose-400">error, contact admin</div>}
          {!error && teams.length === 0 && !loading && (
            <div className="text-sm text-white/50">No teams found.</div>
          )}
          <TeamList
            teams={teams}
            selectedTeamId={selectedTeam?.id}
            onSelect={(team) => {
              setSelectedTeam(team);
              setSelectedGame(null);
            }}
          />
          {loading && <div className="text-xs text-white/50">Chargement des équipes…</div>}
          <Pagination
            page={pageInfo?.page || page}
            totalPages={pageInfo?.totalPages || 1}
            hasPrev={!!pageInfo?.hasPrev}
            hasNext={!!pageInfo?.hasNext}
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
