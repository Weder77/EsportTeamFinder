import React, { useState } from "react";
import Header from "../components/layout/Header";
import Spinner from "../components/common/Spinner";
import { useTierSelection } from "../hooks/useTierSelection";
import SectionTitle from "../components/common/SectionTitle";
import Pagination from "../components/common/Pagination";
import MatchCard from "../components/matches/MatchCard";
import { PlayCircle, Clock, CheckCircle2 } from "lucide-react";
import { useMatches } from "../hooks/useMatches";

export default function MatchesPage() {
  const [query, setQuery] = useState("");
  const [pageRun, setPageRun] = useState(1);
  const [pagePast, setPagePast] = useState(1);
  const [pageUp, setPageUp] = useState(1);
  const { tiers, toggle, setTiers } = useTierSelection([]);

  const tierArg = (tiers && tiers.length > 0) ? tiers : undefined;
  const running = useMatches("running", { page: pageRun, perPage: 5, tiers: tierArg });
  const past = useMatches("past", { page: pagePast, perPage: 5, tiers: tierArg });
  const upcoming = useMatches("upcoming", { page: pageUp, perPage: 5, tiers: tierArg });

  const filter = (list) =>
    (list || []).filter((m) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const opps = (m?.opponents || []).map((o) => (o?.opponent?.name || "").toLowerCase()).join(" ");
      const league = m?.league?.name?.toLowerCase() || "";
      return opps.includes(q) || league.includes(q);
    });

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-gray-100">
      <Header query={query} onChange={setQuery} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-end gap-2 mb-4">
          <span className="text-sm text-white/70">Tiers:</span>
          {['s','a','b'].map((t) => (
            <button
              key={t}
              onClick={() => { toggle(t); setPageRun(1); setPagePast(1); setPageUp(1); }}
              className={`px-2.5 py-1 rounded-lg border text-sm ${tiers.includes(t) ? 'border-fuchsia-500/70 bg-fuchsia-600/25 text-white shadow-[0_0_10px_rgba(168,85,247,0.6),0_0_22px_rgba(168,85,247,0.35)]' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'}`}
              title={t.toUpperCase()}
            >{t.toUpperCase()}</button>
          ))}
          {tiers.length > 0 && (
            <button onClick={() => { setTiers([]); setPageRun(1); setPagePast(1); setPageUp(1); }} className="ml-2 text-xs text-white/60 hover:text-white">Reset</button>
          )}
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Running */}
          <div className="space-y-3">
            <SectionTitle icon={PlayCircle}>En cours</SectionTitle>
            {running.error && <div className="text-sm text-rose-400">Erreur.</div>}
            {running.loading && (
              <div className="py-2 flex justify-center"><Spinner size={20} /></div>
            )}
            {filter(running.data).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
            <Pagination
              page={running.pageInfo?.page || pageRun}
              totalPages={running.pageInfo?.totalPages || 1}
              hasPrev={!!running.pageInfo?.hasPrev}
              hasNext={!!running.pageInfo?.hasNext}
              onChange={(p) => setPageRun(p)}
              arrowsOnly
            />
          </div>

          {/* Upcoming */}
          <div className="space-y-3">
            <SectionTitle icon={Clock}>À venir</SectionTitle>
            {upcoming.error && <div className="text-sm text-rose-400">Erreur.</div>}
            {upcoming.loading && (
              <div className="py-2 flex justify-center"><Spinner size={20} /></div>
            )}
            {filter(upcoming.data).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
            <Pagination
              page={upcoming.pageInfo?.page || pageUp}
              totalPages={upcoming.pageInfo?.totalPages || 1}
              hasPrev={!!upcoming.pageInfo?.hasPrev}
              hasNext={!!upcoming.pageInfo?.hasNext}
              onChange={(p) => setPageUp(p)}
              arrowsOnly
            />
          </div>

          {/* Past */}
          <div className="space-y-3">
            <SectionTitle icon={CheckCircle2}>Joués</SectionTitle>
            {past.error && <div className="text-sm text-rose-400">Erreur.</div>}
            {past.loading && (
              <div className="py-2 flex justify-center"><Spinner size={20} /></div>
            )}
            {filter(past.data).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
            <Pagination
              page={past.pageInfo?.page || pagePast}
              totalPages={past.pageInfo?.totalPages || 1}
              hasPrev={!!past.pageInfo?.hasPrev}
              hasNext={!!past.pageInfo?.hasNext}
              onChange={(p) => setPagePast(p)}
              arrowsOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}
