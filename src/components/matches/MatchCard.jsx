import React from "react";
import fallbackLogo from "../../assets/logo.png";

function Team({ team }) {
  const name = team?.name || team?.slug || "—";
  const img = team?.image_url || team?.logo || fallbackLogo;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <img
        src={img}
        alt={name}
        className="w-6 h-6 rounded bg-black/40 object-contain"
        onError={(e) => {
          if (e.currentTarget.src !== fallbackLogo) e.currentTarget.src = fallbackLogo;
        }}
      />
      <div className="truncate text-sm">{name}</div>
    </div>
  );
}

export default function MatchCard({ match }) {
  const opponents = (match?.opponents || []).map((o) => o?.opponent || o);
  const a = opponents[0] || {};
  const b = opponents[1] || {};
  const when = match?.begin_at ? new Date(match.begin_at) : null;
  const results = Array.isArray(match?.results) ? match.results : [];
  const scoreMap = new Map(results.map((r) => [r.team_id, r.score]));
  const scoreA = scoreMap.get(a.id);
  const scoreB = scoreMap.get(b.id);
  const hasScore = Number.isFinite(scoreA) || Number.isFinite(scoreB);
  const isWinnerA = match?.winner_id && a?.id && match.winner_id === a.id;
  const isWinnerB = match?.winner_id && b?.id && match.winner_id === b.id;
  return (
    <div className="p-3 rounded-2xl border border-white/10 bg-white/5 min-h-[96px] flex flex-col justify-between">
      <div className="text-xs text-white/50 mb-2 min-h-[16px]">
        {match?.league?.name ? `${match.league.name}` : ""}
        {match?.serie?.full_name ? ` • ${match.serie.full_name}` : ""}
        {when ? ` • ${when.toLocaleString()}` : ""}
      </div>
      <div className={`flex items-center ${hasScore ? "gap-3" : "justify-between gap-2"}`}>
        <div className={`flex-1 ${isWinnerA ? "text-white" : "text-white/90"}`}>
          <Team team={a} />
        </div>
        {hasScore ? (
          <div className="px-2 py-1 rounded border border-white/10 bg-white/5 text-sm font-semibold min-w-[52px] text-center">
            {Number.isFinite(scoreA) ? scoreA : "-"} : {Number.isFinite(scoreB) ? scoreB : "-"}
          </div>
        ) : (
          <div className="text-white/60">vs</div>
        )}
        <div className={`flex-1 text-right ${isWinnerB ? "text-white" : "text-white/90"}`}>
          <Team team={b} />
        </div>
      </div>
      <div className={`text-[10px] mt-2 text-white/50 ${match?.number_of_games ? '' : 'invisible'}`}>
        {match?.number_of_games ? `BO${match.number_of_games}` : 'placeholder'}
      </div>
    </div>
  );
}
