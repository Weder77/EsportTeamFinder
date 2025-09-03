import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/layout/Header";
import SectionTitle from "../components/common/SectionTitle";
import Pagination from "../components/common/Pagination";
import Spinner from "../components/common/Spinner";
import { useMatches } from "../hooks/useMatches";
import { useTournaments } from "../hooks/useTournaments";
import { PandaScore } from "../services/pandascore";
import LeaderboardModal from "../components/bet/LeaderboardModal";
import fallbackLogo from "../assets/logo.png";

const LS_KEY = "bets_v1";
const LS_USER = "bets_user";

function loadStore() {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function saveStore(obj) { try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {} }

function getMaxWins(bo) {
  const n = Number(bo) || 3; // default BO3
  return Math.floor(n / 2) + 1;
}

export default function BetPage() {
  const [nick, setNick] = useState(() => localStorage.getItem(LS_USER) || "Moi");
  const [pageUp, setPageUp] = useState(1);
  const perPage = 50; // increase to capture enough upcoming matches per tournament
  const tiersSA = React.useMemo(() => ["s","a"], []);
  const upcoming = useMatches("upcoming", { page: pageUp, perPage, tiers: tiersSA });
  const running = useMatches("running", { page: 1, perPage: 50, tiers: tiersSA });
  const past = useMatches("past", { page: 1, perPage: 50, tiers: tiersSA });
  const { data: tournaments, loading: loadingTournaments } = useTournaments({ page: 1, perPage: 50, tiers: tiersSA });
  const [store, setStore] = useState({});
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [loadingGroup, setLoadingGroup] = useState({});
  const [loadedMatches, setLoadedMatches] = useState({});
  const [copiedByGroup, setCopiedByGroup] = useState({});

  useEffect(() => { setStore(loadStore()); }, []);
  useEffect(() => { if (nick) localStorage.setItem(LS_USER, nick); }, [nick]);

  const predictions = store[nick] || {}; // { [matchId]: { winnerId, score: "2-1", bo } }

  function setPrediction(matchId, pred) {
    const nextUser = { ...(store[nick]||{}) };
    if (pred && (pred.winnerId || pred.score)) nextUser[matchId] = pred; else delete nextUser[matchId];
    const next = { ...store, [nick]: nextUser };
    setStore(next); saveStore(next);
  }
  function clearPrediction(matchId) {
    const next = { ...store, [nick]: { ...(store[nick]||{}) } };
    delete next[nick][matchId];
    saveStore(next); setStore(next);
  }
  function incScore(matchId, side, wins, aId, bId, bo) {
    const pred = predictions[matchId] || {};
    let left = Number.isFinite(pred.left) ? pred.left : 0;
    let right = Number.isFinite(pred.right) ? pred.right : 0;
    if (side === 'left') left = (left + 1) % (wins + 1);
    else right = (right + 1) % (wins + 1);
    if (left === wins && right === wins) {
      if (side === 'left') right = wins - 1; else left = wins - 1;
    }
    const score = `${left}-${right}`;
    let winnerId = null;
    if (left === wins && right <= wins - 1) winnerId = aId;
    else if (right === wins && left <= wins - 1) winnerId = bId;
    setPrediction(matchId, { ...pred, left, right, score, winnerId, bo: bo ?? pred.bo });
  }

  // Build leaderboard from all users in store using past results
  const pastById = useMemo(() => {
    const index = new Map();
    for (const m of past.data || []) index.set(m.id, m);
    return index;
  }, [past.data]);

  const resultsMap = useMemo(() => {
    const map = new Map();
    for (const m of past.data || []) {
      const res = Array.isArray(m.results) ? m.results : [];
      const scoreById = new Map(res.map(r => [r.team_id, r.score]));
      const ops = Array.isArray(m.opponents) ? m.opponents.map(o=>o.opponent) : [];
      const a = ops[0]?.id; const b = ops[1]?.id;
      const sa = a ? scoreById.get(a) : undefined;
      const sb = b ? scoreById.get(b) : undefined;
      map.set(m.id, { winnerId: m.winner_id, a, b, sa, sb });
    }
    return map;
  }, [past.data]);

  const leaderboard = useMemo(() => {
    const out = [];
    for (const user of Object.keys(store)) {
      let pts = 0;
      const preds = store[user] || {};
      for (const [mid, p] of Object.entries(preds)) {
        const real = resultsMap.get(Number(mid));
        if (!real) continue;
        if (p?.winnerId === real.winnerId) {
          // exact score using left-right orientation
          const [left, right] = (p.score||"").split("-").map(n=>parseInt(n,10));
          const exact = Number.isFinite(left) && Number.isFinite(right) && real.sa === left && real.sb === right;
          pts += exact ? 3 : 1;
        }
      }
      out.push({ name: user, points: pts });
    }
    return out.sort((a,b)=>b.points-a.points);
  }, [store, resultsMap]);

  function fmtTime(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  }
  function fmtDateShort(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' }); } catch { return ''; }
  }

  // share handled per-series in header

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-gray-100">
      <Header query={""} onChange={()=>{}} />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <SectionTitle>Bet – Matchs S/A à venir</SectionTitle>
          <div className="flex items-center gap-2">
            <input value={nick} onChange={(e)=>setNick(e.target.value)} placeholder="Votre pseudo"
                   className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-fuchsia-400/60" />
            {/* partage par série, voir boutons dans les groupes */}
            <button className="neon-tab" onClick={()=>setLeaderOpen(true)}>Classement</button>
          </div>
        </div>

        {upcoming.error && <div className="text-sm text-rose-400">Erreur de chargement.</div>}
        {upcoming.loading && <div className="py-4 flex justify-center"><Spinner size={24} /></div>}

        <div className="space-y-4">
          {(() => {
            const upMap = (upcoming.data || []).reduce((acc, m) => {
              const key = m?.tournament?.id || `${m?.league?.id || 'L'}-${m?.serie?.id || 'S'}`;
              const serieName = m?.serie?.full_name || m?.serie?.name || '';
              const name = [m?.league?.name, serieName].filter(Boolean).join(' • ') || (m?.tournament?.name || 'Tournoi');
              if (!acc[key]) acc[key] = { name, rows: [] };
              acc[key].rows.push(m);
              return acc;
            }, {});
            const runMap = (running.data || []).reduce((acc, m) => {
              const key = m?.tournament?.id || `${m?.league?.id || 'L'}-${m?.serie?.id || 'S'}`;
              const serieName = m?.serie?.full_name || m?.serie?.name || '';
              const name = [m?.league?.name, serieName].filter(Boolean).join(' • ') || (m?.tournament?.name || 'Tournoi');
              if (!acc[key]) acc[key] = { name, rows: [] };
              acc[key].rows.push(m);
              return acc;
            }, {});
            const runEntries = Object.entries(runMap);
            const currentArr = runEntries.sort((a,b)=>b[1].rows.length - a[1].rows.length).slice(0,2);
            const currentIds = new Set(currentArr.map(([gid])=>gid));
            const upEntries = Object.entries(upMap);
            const getMin = (g) => {
              const t = g.rows.map(x => new Date(x.begin_at || Date.now()).getTime());
              return t.length ? Math.min(...t) : Date.now();
            };
            const nextArr = upEntries
              .filter(([gid]) => !currentIds.has(gid))
              .sort((a,b)=> getMin(a[1]) - getMin(b[1]))
              .slice(0,2);
            const toShow = [...currentArr, ...nextArr];
            const renderGroup = ([gid, group]) => (
            <div key={gid} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{group.name || 'Tournoi'}</div>
                  <div className="text-xs text-white/60 flex items-center gap-2">
                    <span>{group.rows.length} match(s) à venir</span>
                    {group.rows.some(r => (r.status || '').toLowerCase() === 'running') ? (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-300/90">En cours</span>
                    ) : (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-300/90">À venir</span>
                    )}
                  </div>
                  {(() => {
                    const begins = (group.rows || [])
                      .map(r => Date.parse(r.begin_at))
                      .filter(n => Number.isFinite(n));
                    const ends = (group.rows || [])
                      .map(r => Date.parse(r.end_at || r.begin_at))
                      .filter(n => Number.isFinite(n));
                    if (!begins.length) return null;
                    const start = new Date(Math.min(...begins));
                    const end = new Date((ends.length ? Math.max(...ends) : Math.max(...begins)));
                    return (
                      <div className="text-[10px] text-white/60 mt-0.5">
                        {fmtDateShort(start)} → {fmtDateShort(end)}
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={async ()=>{
                    try {
                      const ids = new Set(group.rows.map(x=>x.id));
                      const lines = ['🔮 Mes bets — ' + (group.name || 'Tournoi')];
                      for (const [mid, p] of Object.entries(predictions)) {
                        if (!ids.has(Number(mid))) continue;
                        if (!p?.winnerId || !p?.score) continue;
                        const m = group.rows.find(x=>x.id===Number(mid));
                        const ops = Array.isArray(m.opponents) ? m.opponents.map(o=>o.opponent) : [];
                        const a = ops[0] || {}; const b = ops[1] || {};
                        const leftRight = p.score; const bo = m.number_of_games ? ` BO${m.number_of_games}` : '';
                        const leftEmoji = p.winnerId === a.id ? '✅' : '❌';
                        const rightEmoji = p.winnerId === b.id ? '✅' : '❌';
                        lines.push(`• ${leftEmoji} ${a.name || '—'} ⚔️ ${rightEmoji} ${b.name || '—'} ${leftRight}${bo}`);
                      }
                      if (lines.length === 1) lines.push('(Aucun bet sélectionné)');
                      const text = lines.join('\n');
                      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(text);
                      setCopiedByGroup(s=>({ ...s, [gid]: true }));
                      setTimeout(()=> setCopiedByGroup(s=>({ ...s, [gid]: false })), 1500);
                    } catch {}
                  }}
                  className={`text-xs px-2 py-0.5 rounded-lg border ${copiedByGroup[gid] ? 'border-fuchsia-500/60 bg-fuchsia-600/25' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >{copiedByGroup[gid] ? 'Copié !' : 'Partager mes bets'}</button>
                <button onClick={()=> setOpenGroups(s=>({...s, [gid]: !s[gid]}))} className={`text-xs px-2 py-0.5 rounded-lg border ${openGroups[gid] ? 'border-sky-400/60 bg-sky-500/15' : 'border-white/10 bg-white/5'}`}>{openGroups[gid] ? 'Masquer' : 'Voir'}</button>
              </div>
              {openGroups[gid] && (
                <div className="p-3 space-y-3">
                  {group.rows.map((m) => {
                    const ops = Array.isArray(m.opponents) ? m.opponents.map(o=>o.opponent) : [];
                    const a = ops[0] || {}; const b = ops[1] || {};
                    const bo = m.number_of_games || 3; const wins = getMaxWins(bo);
                    const pred = predictions[m.id] || {};
                    const winnerId = pred.winnerId || null;
                    const left = Number.isFinite(pred.left) ? pred.left : 0;
                    const right = Number.isFinite(pred.right) ? pred.right : 0;
                    const score = `${left}-${right}`;
                    const hasPick = !!winnerId && (left+right>0);
                    return (
                      <div key={m.id} className={`p-3 rounded-xl border bg-white/5 ${hasPick ? 'border-sky-400/50 bg-sky-500/10' : 'border-white/10'}`}>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                          <button onClick={()=> { setPrediction(m.id, { ...pred, winnerId: a.id, bo }); incScore(m.id,'left',wins,a.id,b.id,bo); }} aria-pressed={winnerId===a.id} className={`px-2 py-2 rounded-lg border flex items-center gap-2 min-w-0 ${winnerId===a.id? 'border-fuchsia-500/70 bg-fuchsia-600/25 ring-1 ring-fuchsia-400/60' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                            <img src={a.image_url || fallbackLogo} alt={a.name} className="w-5 h-5 rounded bg-black/40 object-contain" onError={(e)=>{ if(e.currentTarget.src!==fallbackLogo) e.currentTarget.src = fallbackLogo; }} />
                            <span className="truncate">{a.name || '—'}</span>
                          </button>
                          <div className="text-center">
                            <div className="text-[10px] text-white/70 mb-0.5">BO{bo}</div>
                            <div className="inline-flex items-center gap-2">
                              <button onClick={()=>incScore(m.id,'left',wins,a.id,b.id,bo)} className="w-8 h-8 inline-flex items-center justify-center text-center leading-none rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold">{left}</button>
                              <span className="text-white/50">:</span>
                              <button onClick={()=>incScore(m.id,'right',wins,a.id,b.id,bo)} className="w-8 h-8 inline-flex items-center justify-center text-center leading-none rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold">{right}</button>
                            </div>
                          </div>
                          <button onClick={()=> { setPrediction(m.id, { ...pred, winnerId: b.id, bo }); incScore(m.id,'right',wins,a.id,b.id,bo); }} aria-pressed={winnerId===b.id} className={`px-2 py-2 rounded-lg border flex items-center gap-2 justify-end min-w-0 ${winnerId===b.id? 'border-fuchsia-500/70 bg-fuchsia-600/25 ring-1 ring-fuchsia-400/60' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                            <span className="truncate text-right">{b.name || '—'}</span>
                            <img src={b.image_url || fallbackLogo} alt={b.name} className="w-5 h-5 rounded bg-black/40 object-contain" onError={(e)=>{ if(e.currentTarget.src!==fallbackLogo) e.currentTarget.src = fallbackLogo; }} />
                          </button>
                        </div>
                          <div className="mt-2 flex items-center gap-2">
                            {m.begin_at ? (
                              <span className="shrink-0 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-white/80">{fmtTime(m.begin_at)}</span>
                            ) : null}
                            {m.begin_at ? (
                              <span className="shrink-0 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-white/80">{fmtDateShort(m.begin_at)}</span>
                            ) : null}
                          </div>
                          <div className="mt-2 text-xs text-white/50">Votre prono: {winnerId ? (winnerId===a.id? a.name : b.name) : '—'} • {score}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            );
            return (
              <>
                {currentArr.length ? (
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-wider text-white/60">Séries en cours</div>
                    {currentArr.map(renderGroup)}
                  </div>
                ) : null}
                {nextArr.length ? (
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-wider text-white/60">Séries à venir</div>
                    {nextArr.map(renderGroup)}
                  </div>
                ) : null}
              </>
            );
          })()}
        </div>

        <Pagination
          page={upcoming.pageInfo?.page || pageUp}
          totalPages={upcoming.pageInfo?.totalPages || 1}
          hasPrev={!!upcoming.pageInfo?.hasPrev}
          hasNext={!!upcoming.pageInfo?.hasNext}
          onChange={(p)=>setPageUp(p)}
          arrowsOnly
        />
      </div>
      <LeaderboardModal open={leaderOpen} onClose={()=>setLeaderOpen(false)} items={leaderboard} />
    </div>
  );
}
