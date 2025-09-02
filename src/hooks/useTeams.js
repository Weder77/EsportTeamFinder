import { useEffect, useMemo, useState } from "react";
import { PandaScore } from "../services/pandascore";

function mapTeam(apiTeam) {
  if (!apiTeam) return null;
  const abbrev = apiTeam.acronym || (apiTeam.name || "").slice(0, 3).toUpperCase();
  const games = [];
  // PandaScore may provide current_videogame or videogames array
  if (apiTeam.current_videogame?.name) games.push(apiTeam.current_videogame.name);
  if (Array.isArray(apiTeam.videogames)) {
    for (const vg of apiTeam.videogames) if (vg?.name && !games.includes(vg.name)) games.push(vg.name);
  }
  const players = Array.isArray(apiTeam.players)
    ? apiTeam.players.map((p) => ({
        id: String(p.id || p.slug || p.name),
        slug: p.slug || null,
        name: p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim(),
        nationality: p.nationality || "",
        image: p.image_url || "",
        active: p.active !== false,
        role: p.role || null,
      }))
    : [];
  return {
    id: String(apiTeam.id ?? apiTeam.slug ?? abbrev),
    name: apiTeam.name || abbrev,
    short: abbrev,
    country: apiTeam.location || apiTeam.country || "—",
    accent: "#8b5cf6", // default for now
    logo: apiTeam.image_url || "",
    founded: apiTeam.founded || apiTeam.created_at || null,
    ceos: [],
    games,
    trophies: [],
    players,
  };
}

export function useTeams({ page = 1, perPage = 10, search = "" } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState({ page, perPage, hasNext: false, hasPrev: false });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const { items, pagination } = await PandaScore.teams({ page, perPage });
        if (!cancelled) {
          setData(Array.isArray(items) ? items.map(mapTeam).filter(Boolean) : []);
          setPageInfo({ ...(pagination || {}), page, perPage });
        }
      } catch (e) {
        // Log details for troubleshooting in dev console
        // eslint-disable-next-line no-console
        console.error("PandaScore teams fetch failed", e);
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [page, perPage]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.short || "").toLowerCase().includes(q)
    );
  }, [data, search]);

  return { data: filtered, raw: data, loading, error, pageInfo };
}
