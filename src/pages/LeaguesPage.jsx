import React, { useMemo, useState } from "react";
import Pagination from "../components/common/Pagination";
import SectionTitle from "../components/common/SectionTitle";
import { Trophy, Calendar, Layers } from "lucide-react";
import { useLeagues } from "../hooks/useLeagues";
import Header from "../components/layout/Header";
import { useTournaments } from "../hooks/useTournaments";
import { useSeries } from "../hooks/useSeries";
import logo from "../assets/logo.png";
import DetailsModal from "../components/common/DetailsModal";
import { useTierSelection } from "../hooks/useTierSelection";
import Spinner from "../components/common/Spinner";

export default function LeaguesPage() {
  const [pageLeagues, setPageLeagues] = useState(1);
  const [pageSeries, setPageSeries] = useState(1);
  const [pageTournaments, setPageTournaments] = useState(1);
  const [query, setQuery] = useState("");
  const { tiers, toggle, setTiers } = useTierSelection([]); // persisted
  const perPage = 6;
  const tierArg = (tiers && tiers.length > 0) ? tiers : undefined;
  const { data: leagues, loading: loadingLeagues, error: errorLeagues, pageInfo: pageInfoLeagues } = useLeagues({ page: pageLeagues, perPage, tiers: tierArg });
  const { data: series, loading: loadingSeries, error: errorSeries, pageInfo: pageInfoSeries } = useSeries({ page: pageSeries, perPage, tiers: tierArg });
  const { data: tournaments, loading: loadingTournaments, error: errorTournaments, pageInfo: pageInfoTournaments } = useTournaments({ page: pageTournaments, perPage, tiers: tierArg });
  const [modal, setModal] = useState(null);

  const q = (query || "").toLowerCase().trim();
  const filteredLeagues = useMemo(() =>
    leagues.filter(lg => (lg?.name || "").toLowerCase().includes(q) || (lg?.slug || "").toLowerCase().includes(q))
  , [leagues, q]);
  const filteredSeries = useMemo(() =>
    series.filter(se =>
      (se?.name || "").toLowerCase().includes(q) ||
      (se?.full_name || "").toLowerCase().includes(q) ||
      (se?.league?.name || "").toLowerCase().includes(q)
    )
  , [series, q]);
  const filteredTournaments = useMemo(() =>
    tournaments.filter(tn =>
      (tn?.name || "").toLowerCase().includes(q) ||
      (tn?.league?.name || "").toLowerCase().includes(q) ||
      (tn?.serie?.full_name || tn?.serie?.name || "").toLowerCase().includes(q)
    )
  , [tournaments, q]);

  function fmtDate(d) {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "2-digit" }); }
    catch { return String(d).slice(0, 10); }
  }
  function fmtDateShort(d) {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("fr-FR", { year: "2-digit", month: "short", day: "2-digit" }); }
    catch { return String(d).slice(0, 10); }
  }

  function openLeagueDetails(lg) {
    setModal({
      title: lg?.name || "League",
      subtitle: lg?.videogame?.name ? `Jeu • ${lg.videogame.name}` : undefined,
      imageUrl: lg?.image_url || logo,
      items: [
        ["Nom", lg?.name],
        ["Slug", lg?.slug],
        ["Jeu", lg?.videogame?.name],
        ["ID", lg?.id],
      ],
    });
  }

  function openSeriesDetails(se) {
    const period = `${se?.year ? `Année ${se.year}` : ''}${se?.season ? ` • ${se.season}` : ''}`.trim();
    setModal({
      title: se?.full_name || se?.name || "Series",
      subtitle: se?.league?.name || undefined,
      imageUrl: se?.image_url || se?.league?.image_url || logo,
      items: [
        ["League", se?.league?.name],
        ["Nom", se?.name],
        ["Période", period],
        ["Début", se?.begin_at ? fmtDate(se.begin_at) : undefined],
        ["Fin", se?.end_at ? fmtDate(se.end_at) : undefined],
        ["ID", se?.id],
      ],
    });
  }

  function openTournamentDetails(tn) {
    const dates = `${fmtDate(tn?.begin_at)}${tn?.end_at ? ` → ${fmtDate(tn.end_at)}` : ''}`.trim();
    setModal({
      title: tn?.name || "Tournament",
      subtitle: `${tn?.league?.name || ''}${tn?.serie?.full_name ? ` • ${tn.serie.full_name}` : ''}` || undefined,
      imageUrl: tn?.league?.image_url || logo,
      items: [
        ["League", tn?.league?.name],
        ["Série", tn?.serie?.full_name || tn?.serie?.name],
        ["Statut", tn?.status],
        ["Dates", dates],
        ["Région", tn?.region || tn?.location],
        ["Vainqueur", tn?.winner?.name],
        ["Jeu", tn?.videogame?.name],
        ["ID", tn?.id],
      ],
    });
  }

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-gray-100">
      <Header query={query} onChange={setQuery} />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-white/70">Tiers:</span>
          {['s','a','b'].map((t) => (
            <button
              key={t}
              onClick={() => { toggle(t); setPageLeagues(1); setPageSeries(1); setPageTournaments(1); }}
              className={`px-2.5 py-1 rounded-lg border text-sm ${tiers.includes(t) ? 'border-fuchsia-500/70 bg-fuchsia-600/25 text-white shadow-[0_0_10px_rgba(168,85,247,0.6),0_0_22px_rgba(168,85,247,0.35)]' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'}`}
              title={t.toUpperCase()}
            >{t.toUpperCase()}</button>
          ))}
          {tiers.length > 0 && (
            <button onClick={() => { setTiers([]); setPageLeagues(1); setPageSeries(1); setPageTournaments(1); }} className="ml-2 text-xs text-white/60 hover:text-white">Réinitialiser</button>
          )}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <section className="space-y-3">
            <SectionTitle icon={Trophy}>Leagues (marques de tournois)</SectionTitle>
            <p className="text-sm text-white/60">
              Une <span className="text-white">league</span> est la compétition en tant que marque (ex: BLAST Premier,
              ESL Pro League). Elle regroupe des saisons/séries sur plusieurs années.
            </p>

            {errorLeagues && <div className="text-sm text-rose-400">Erreur de chargement des leagues.</div>}
            {loadingLeagues && (
              <div className="py-2 flex justify-center"><Spinner size={20} /></div>
            )}

            <div className="grid gap-3">
              {filteredLeagues.map((lg) => (
                <button key={lg.id} onClick={() => openLeagueDetails(lg)} className="text-left p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <img
                      src={lg.image_url || logo}
                      alt={lg.name}
                      className="w-10 h-10 rounded bg-black/40 object-contain"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="font-semibold truncate leading-tight">{lg.name}</div>
                      <div className="text-xs leading-4 invisible">placeholder</div>
                      <div className="text-xs leading-4 invisible">placeholder</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Pagination
              page={pageInfoLeagues?.page || pageLeagues}
              totalPages={pageInfoLeagues?.totalPages || 1}
              hasPrev={!!pageInfoLeagues?.hasPrev}
              hasNext={!!pageInfoLeagues?.hasNext}
              onChange={(p) => setPageLeagues(p)}
              arrowsOnly
            />
          </section>
          <section className="space-y-3">
            <SectionTitle icon={Layers}>Séries (saisons/splits)</SectionTitle>
            <p className="text-sm text-white/60">
              Une <span className="text-white">série</span> est une saison/split d’une league (ex: Closed Qualifier: Series #6 season 3 2025).
              Elle relie la league aux tournois qui composent l’édition.
            </p>

            {errorSeries && <div className="text-sm text-rose-400">Erreur de chargement des séries.</div>}
            {loadingSeries && (
              <div className="py-2 flex justify-center"><Spinner size={20} /></div>
            )}

            <div className="grid gap-3">
              {filteredSeries.map((se) => (
                <button key={se.id} onClick={() => openSeriesDetails(se)} className="text-left p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition cursor-pointer">
                  <div className="flex items-start gap-3">
                    <img src={se?.image_url || se?.league?.image_url || logo} alt={se?.full_name || se?.name}
                         className="w-10 h-10 rounded bg-black/40 object-contain" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="font-semibold truncate leading-tight">{se?.full_name || se?.name}</div>
                      <div className={`text-xs text-white/60 truncate ${se?.league?.name ? '' : 'invisible'}`}>{se?.league?.name || 'placeholder'}</div>
                      {(() => {
                        const b = se?.begin_at ? fmtDateShort(se.begin_at) : '';
                        const e = se?.end_at ? fmtDateShort(se.end_at) : '';
                        const dates = [b, e].filter(Boolean).join(' → ');
                        return (
                          <div className={`text-xs text-white/50 ${dates ? '' : 'invisible'}`}>{dates || 'placeholder'}</div>
                        );
                      })()}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Pagination
              page={pageInfoSeries?.page || pageSeries}
              totalPages={pageInfoSeries?.totalPages || 1}
              hasPrev={!!pageInfoSeries?.hasPrev}
              hasNext={!!pageInfoSeries?.hasNext}
              onChange={(p) => setPageSeries(p)}
              arrowsOnly
            />
          </section>

          <section className="space-y-3">
            <SectionTitle icon={Calendar}>Tournaments (événements concrets)</SectionTitle>
            <p className="text-sm text-white/60">
              Un <span className="text-white">tournament</span> est une édition précise avec des dates et un état
              (à venir, en cours, terminé) rattachée à une league et une série.
            </p>

            {errorTournaments && <div className="text-sm text-rose-400">Erreur de chargement des tournaments.</div>}
            {loadingTournaments && (
              <div className="py-2 flex justify-center"><Spinner size={20} /></div>
            )}

            <div className="grid gap-3">
              {filteredTournaments.map((tn) => (
                <button key={tn.id} onClick={() => openTournamentDetails(tn)} className="text-left p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition cursor-pointer">
                  <div className="flex items-start gap-3">
                    <img src={(tn?.league?.image_url) || logo} alt={tn?.league?.name || tn?.name} className="w-10 h-10 rounded bg-black/40 object-contain" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="font-semibold truncate leading-tight">{tn.name}</div>
                      {(() => {
                        const meta = `${tn?.league?.name || ''}${tn?.serie?.full_name ? ` • ${tn.serie.full_name}` : ''}`;
                        return (
                          <div className={`text-xs text-white/60 truncate ${meta ? '' : 'invisible'}`}>{meta || 'placeholder'}</div>
                        );
                      })()}
                      {(() => {
                        const dates = `${fmtDate(tn?.begin_at)}${tn?.end_at ? ` → ${fmtDate(tn.end_at)}` : ''}${tn?.status ? ` • ${tn.status}` : ''}`.trim();
                        return (
                          <div className={`text-xs text-white/50 ${dates ? '' : 'invisible'}`}>{dates || 'placeholder'}</div>
                        );
                      })()}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Pagination
              page={pageInfoTournaments?.page || pageTournaments}
              totalPages={pageInfoTournaments?.totalPages || 1}
              hasPrev={!!pageInfoTournaments?.hasPrev}
              hasNext={!!pageInfoTournaments?.hasNext}
              onChange={(p) => setPageTournaments(p)}
              arrowsOnly
            />
          </section>
        </div>
      </div>
      <DetailsModal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title}
        subtitle={modal?.subtitle}
        imageUrl={modal?.imageUrl}
        items={modal?.items || []}
      />
    </div>
  );
}
