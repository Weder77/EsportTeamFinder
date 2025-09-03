import { useEffect, useMemo, useState } from "react";
import { PandaScore } from "../services/pandascore";

function mapPlayer(p) {
  if (!p) return null;
  return {
    id: String(p.id || p.slug || p.name),
    name: p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim(),
    nationality: p.nationality || p.country || "",
    image: p.image_url || "",
    active: p.active !== false,
    role: p.role || null,
    game: p.current_videogame?.name || null,
  };
}

function toGameKey(name) {
  if (!name) return null;
  const n = String(name).toLowerCase();
  if (/(counter[-\s]?strike|csgo|cs2|cs 2|cs:go)/.test(n)) return "csgo";
  if (/(league of legends|lol)/.test(n)) return "lol";
  if (/valorant/.test(n)) return "valorant";
  return null;
}

export function useTeamPlayers(teamIdOrSlug, { page = 1, perPage = 50, gameFilter = null } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState({ page, perPage, hasPrev: false, hasNext: false });

  useEffect(() => {
    if (!teamIdOrSlug) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const { items, pagination } = await PandaScore.teamPlayers({ teamIdOrSlug, page, perPage });
        // Enrich players with their videogame by calling game-specific endpoints using IDs
        const ids = Array.isArray(items) ? items.map((p) => p.id).filter(Boolean) : [];
        let gameResults = [];
        if (ids.length) {
          const key = toGameKey(gameFilter);
          const wantedGames = key ? [key] : ["csgo", "lol", "valorant"];
          for (const g of wantedGames) {
            try {
              const res = await PandaScore.playersByGameIds({ game: g, ids });
              gameResults.push(...res.map((r) => ({ id: r.id, game: r.current_videogame?.name || g })));
            } catch (_) {
              // ignore game endpoint errors to keep roster visible
            }
          }
        }
        const gameById = new Map(gameResults.map((x) => [x.id, x.game]));
        const mapped = Array.isArray(items)
          ? items
              .map(mapPlayer)
              .filter(Boolean)
              .map((p) => ({ ...p, game: gameById.get(Number(p.id)) || p.game || null }))
          : [];
        if (!cancelled) {
          setData(mapped);
          setPageInfo({ ...(pagination || {}), page, perPage });
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [teamIdOrSlug, page, perPage]);

  const active = useMemo(() => {
    const key = toGameKey(gameFilter);
    return data.filter((p) => p.active && (!key || toGameKey(p.game) === key));
  }, [data, gameFilter]);
  return { data: active, raw: data, loading, error, pageInfo };
}
