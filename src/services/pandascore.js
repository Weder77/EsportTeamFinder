// Minimal PandaScore client

const API_BASE = "https://api.pandascore.co";
const TOKEN = import.meta.env.VITE_PANDASCORE_TOKEN;

async function request(path, params = {}, init = {}) {
  if (!TOKEN) {
    throw new Error("Missing VITE_PANDASCORE_TOKEN env variable");
  }
  const url = new URL(API_BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  // Use Authorization header only (no token in query string)

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    let detail = "";
    try {
      const errJson = await res.json();
      detail = errJson?.error || errJson?.message || JSON.stringify(errJson);
    } catch (_) {
      try { detail = await res.text(); } catch (_) { /* ignore */ }
    }
    throw new Error(`PandaScore error ${res.status}: ${detail}`);
  }
  return res.json();
}

export const PandaScore = {
  // Teams list (paginated) – restricted to Counter-Strike teams for now
  teams: async ({ page = 1, perPage = 10 } = {}) => {
    // We need pagination info from headers
    if (!TOKEN) throw new Error("Missing VITE_PANDASCORE_TOKEN env variable");
    const url = new URL(API_BASE + "/csgo/teams");
    url.searchParams.set("page", page);
    url.searchParams.set("per_page", perPage);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    });
    if (!res.ok) {
      let detail = "";
      try {
        const errJson = await res.json();
        detail = errJson?.error || errJson?.message || JSON.stringify(errJson);
      } catch (_) {
        try { detail = await res.text(); } catch (_) { /* ignore */ }
      }
      throw new Error(`PandaScore error ${res.status}: ${detail}`);
    }
    const link = res.headers.get("link") || res.headers.get("Link");
    const pagination = parseLinkHeader(link);
    const totalHeader = res.headers.get("x-total") || res.headers.get("X-Total");
    const total = totalHeader ? parseInt(totalHeader, 10) : null;
    const totalPages = pagination.lastPage || (total ? Math.ceil(total / perPage) : null);
    const hasPrev = pagination.hasPrev || (typeof totalPages === "number" ? page > 1 : false);
    const hasNext = pagination.hasNext || (typeof totalPages === "number" ? page < totalPages : false);
    const items = await res.json();
    return { items, pagination: { ...pagination, hasPrev, hasNext, total, totalPages, page, perPage } };
  },
  // Aggregate unique teams that appear in matches for a given tier (e.g., 's')
  topTeamsByTier: async ({ tier = 's', tiers, kinds = ['running', 'past'], pages = 1, perPage = 50 } = {}) => {
    const counts = new Map();
    const teamById = new Map();
    for (const kind of kinds) {
      for (let p = 1; p <= Math.max(1, pages); p++) {
        const { items } = await PandaScore.csgoMatches(kind, { page: p, perPage, tier, tiers });
        for (const m of items || []) {
          const opps = Array.isArray(m?.opponents) ? m.opponents : [];
          for (const o of opps) {
            const t = o?.opponent || o;
            if (!t?.id) continue;
            teamById.set(t.id, t);
            counts.set(t.id, (counts.get(t.id) || 0) + 1);
          }
        }
      }
    }
    const out = Array.from(counts.entries())
      .map(([id, count]) => ({ count, team: teamById.get(id) }))
      .sort((a, b) => b.count - a.count);
    return { totalUnique: out.length, items: out };
  },
  // CS:GO players search
  csgoPlayers: async ({ page = 1, perPage = 10, search = "" } = {}) => {
    const url = new URL(API_BASE + "/csgo/players");
    url.searchParams.set("page", page);
    url.searchParams.set("per_page", perPage);
    if (search) {
      // Support common PandaScore search param shape
      url.searchParams.set("search[name]", search);
    }
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    });
    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch (_) {}
      throw new Error(`PandaScore csgo players error ${res.status}: ${detail}`);
    }
    const link = res.headers.get("link") || res.headers.get("Link");
    const pagination = parseLinkHeader(link);
    const totalHeader = res.headers.get("x-total") || res.headers.get("X-Total");
    const total = totalHeader ? parseInt(totalHeader, 10) : null;
    const items = await res.json();
    const totalPages = pagination.lastPage || (total ? Math.ceil(total / perPage) : null);
    const hasPrev = pagination.hasPrev || (typeof totalPages === "number" ? page > 1 : false);
    const hasNext = pagination.hasNext || (typeof totalPages === "number" ? page < totalPages : false);
    return { items, pagination: { ...pagination, total, totalPages, hasPrev, hasNext, page, perPage } };
  },
  // CS:GO tournaments (events/editions within leagues/series)
  csgoTournaments: async ({ page = 1, perPage = 10, tier, tiers } = {}) => {
    const buildUrl = (withTier = true) => {
      const u = new URL(API_BASE + "/csgo/tournaments");
      u.searchParams.set("page", page);
      u.searchParams.set("per_page", perPage);
      if (withTier) {
        const tierVal = Array.isArray(tiers) ? tiers.join(",") : (tier || "");
        if (tierVal) u.searchParams.set("filter[tier]", tierVal);
      }
      return u;
    };

    let url = buildUrl(true);
    let res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    });
    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch (_) {}
      // If the API rejects filter[tier] for this resource/plan, retry without it
      if (res.status === 400 && /Provided attributes do not exist/i.test(detail || "")) {
        url = buildUrl(false);
        res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } });
      }
      if (!res.ok) throw new Error(`PandaScore csgo tournaments error ${res.status}: ${detail}`);
    }
    const link = res.headers.get("link") || res.headers.get("Link");
    const pagination = parseLinkHeader(link);
    const totalHeader = res.headers.get("x-total") || res.headers.get("X-Total");
    const total = totalHeader ? parseInt(totalHeader, 10) : null;
    const items = await res.json();
    const totalPages = pagination.lastPage || (total ? Math.ceil(total / perPage) : null);
    const hasPrev = pagination.hasPrev || (typeof totalPages === "number" ? page > 1 : false);
    const hasNext = pagination.hasNext || (typeof totalPages === "number" ? page < totalPages : false);
    return { items, pagination: { ...pagination, total, totalPages, hasPrev, hasNext, page, perPage } };
  },
  // CS:GO series (seasons/splits within a league)
  csgoSeries: async ({ page = 1, perPage = 10, tier, tiers } = {}) => {
    const buildUrl = (withTier = true) => {
      const u = new URL(API_BASE + "/csgo/series");
      u.searchParams.set("page", page);
      u.searchParams.set("per_page", perPage);
      if (withTier) {
        const tierVal = Array.isArray(tiers) ? tiers.join(",") : (tier || "");
        if (tierVal) u.searchParams.set("filter[tier]", tierVal);
      }
      return u;
    };
    let url = buildUrl(true);
    let res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    });
    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch (_) {}
      if (res.status === 400 && /Provided attributes do not exist/i.test(detail || "")) {
        url = buildUrl(false);
        res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } });
      }
      if (!res.ok) throw new Error(`PandaScore csgo series error ${res.status}: ${detail}`);
    }
    const link = res.headers.get("link") || res.headers.get("Link");
    const pagination = parseLinkHeader(link);
    const totalHeader = res.headers.get("x-total") || res.headers.get("X-Total");
    const total = totalHeader ? parseInt(totalHeader, 10) : null;
    const items = await res.json();
    const totalPages = pagination.lastPage || (total ? Math.ceil(total / perPage) : null);
    const hasPrev = pagination.hasPrev || (typeof totalPages === "number" ? page > 1 : false);
    const hasNext = pagination.hasNext || (typeof totalPages === "number" ? page < totalPages : false);
    return { items, pagination: { ...pagination, total, totalPages, hasPrev, hasNext, page, perPage } };
  },

  // Example placeholder removed (global /players is not available on all plans)

  // Players for a given team (current roster)
  // Some plans/resources don't support /teams/{id}/players.
  // Use /csgo/players?filter[team_id]=ID (or fallback filter[current_team_id]).
  teamPlayers: async ({ teamIdOrSlug, page = 1, perPage = 50 } = {}) => {
    if (!teamIdOrSlug) throw new Error("teamIdOrSlug is required");
    if (!TOKEN) throw new Error("Missing VITE_PANDASCORE_TOKEN env variable");

    async function tryWithFilter(paramKey) {
      const url = new URL(API_BASE + "/csgo/players");
      url.searchParams.set("page", page);
      url.searchParams.set("per_page", perPage);
      url.searchParams.set(`filter[${paramKey}]`, String(teamIdOrSlug));
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
      });
      return res;
    }

    // First attempt: team_id
    let res = await tryWithFilter("team_id");
    // Fallback: current_team_id (depending on the game resource)
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      if (res.status === 400 || res.status === 404) {
        const res2 = await tryWithFilter("current_team_id");
        if (res2.ok) res = res2; else {
          // Final attempt failed
          throw new Error(`PandaScore team players error ${res2.status}: ${txt || (await res2.text().catch(()=>''))}`);
        }
      } else {
        throw new Error(`PandaScore team players error ${res.status}: ${txt}`);
      }
    }

    const link = res.headers.get("link") || res.headers.get("Link");
    const pagination = parseLinkHeader(link);
    const totalHeader = res.headers.get("x-total") || res.headers.get("X-Total");
    const total = totalHeader ? parseInt(totalHeader, 10) : null;
    const items = await res.json();
    const totalPages = pagination.lastPage || (total ? Math.ceil(total / perPage) : null);
    const hasPrev = pagination.hasPrev || (typeof totalPages === "number" ? page > 1 : false);
    const hasNext = pagination.hasNext || (typeof totalPages === "number" ? page < totalPages : false);
    return { items: Array.isArray(items) ? items : [], pagination: { ...pagination, hasPrev, hasNext, total, totalPages, page, perPage } };
  },

  // Fetch players for a specific game by an array of player IDs
  // game values supported: "csgo" | "lol" | "valorant"
  playersByGameIds: async ({ game, ids = [], perPage = 100 } = {}) => {
    if (!game) throw new Error("game is required");
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const pathMap = { csgo: "/csgo/players", lol: "/lol/players", valorant: "/valorant/players" };
    const path = pathMap[game.toLowerCase()];
    if (!path) throw new Error(`Unsupported game: ${game}`);

    // Chunk to avoid too long query strings
    const chunks = [];
    const size = 50;
    for (let i = 0; i < ids.length; i += size) chunks.push(ids.slice(i, i + size));

    const results = [];
    for (const chunk of chunks) {
      const url = new URL(API_BASE + path);
      url.searchParams.set("per_page", String(Math.min(perPage, 100)));
      for (const id of chunk) url.searchParams.append("id", String(id));
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`PandaScore ${path} error ${res.status}: ${msg}`);
      }
      const json = await res.json();
      results.push(...(Array.isArray(json) ? json : []));
    }
    return results;
  },

  // Player details by ID or slug
  player: async (idOrSlug) => {
    if (!idOrSlug) throw new Error("player idOrSlug is required");
    const url = new URL(API_BASE + `/players/${encodeURIComponent(idOrSlug)}`);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    });
    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch (_) {}
      throw new Error(`PandaScore player error ${res.status}: ${detail}`);
    }
    return res.json();
  },
  // CS:GO leagues (tournaments overview)
  csgoLeagues: async ({ page = 1, perPage = 10, tier, tiers } = {}) => {
    const buildUrl = (withTier = true) => {
      const u = new URL(API_BASE + "/csgo/leagues");
      u.searchParams.set("page", page);
      u.searchParams.set("per_page", perPage);
      if (withTier) {
        const tierVal = Array.isArray(tiers) ? tiers.join(",") : (tier || "");
        if (tierVal) u.searchParams.set("filter[tier]", tierVal);
      }
      return u;
    };
    let url = buildUrl(true);
    let res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    });
    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch (_) {}
      if (res.status === 400 && /Provided attributes do not exist/i.test(detail || "")) {
        url = buildUrl(false);
        res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } });
      }
      if (!res.ok) throw new Error(`PandaScore csgo leagues error ${res.status}: ${detail}`);
    }
    const link = res.headers.get("link") || res.headers.get("Link");
    const pagination = parseLinkHeader(link);
    const totalHeader = res.headers.get("x-total") || res.headers.get("X-Total");
    const total = totalHeader ? parseInt(totalHeader, 10) : null;
    const items = await res.json();
    const totalPages = pagination.lastPage || (total ? Math.ceil(total / perPage) : null);
    const hasPrev = pagination.hasPrev || (typeof totalPages === "number" ? page > 1 : false);
    const hasNext = pagination.hasNext || (typeof totalPages === "number" ? page < totalPages : false);
    return { items, pagination: { ...pagination, total, totalPages, hasPrev, hasNext, page, perPage } };
  },
  // CS:GO maps
  csgoMaps: async ({ page = 1, perPage = 12 } = {}) => {
    const url = new URL(API_BASE + "/csgo/maps");
    url.searchParams.set("page", page);
    url.searchParams.set("per_page", perPage);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    });
    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch (_) {}
      throw new Error(`PandaScore csgo maps error ${res.status}: ${detail}`);
    }
    const link = res.headers.get("link") || res.headers.get("Link");
    const pagination = parseLinkHeader(link);
    const totalHeader = res.headers.get("x-total") || res.headers.get("X-Total");
    const total = totalHeader ? parseInt(totalHeader, 10) : null;
    const items = await res.json();
    const totalPages = pagination.lastPage || (total ? Math.ceil(total / perPage) : null);
    const hasPrev = pagination.hasPrev || (typeof totalPages === "number" ? page > 1 : false);
    const hasNext = pagination.hasNext || (typeof totalPages === "number" ? page < totalPages : false);
    return { items, pagination: { ...pagination, total, totalPages, hasPrev, hasNext, page, perPage } };
  },
  // CS:GO weapons
  csgoWeapons: async ({ page = 1, perPage = 12 } = {}) => {
    const url = new URL(API_BASE + "/csgo/weapons");
    url.searchParams.set("page", page);
    url.searchParams.set("per_page", perPage);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    });
    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch (_) {}
      throw new Error(`PandaScore csgo weapons error ${res.status}: ${detail}`);
    }
    const link = res.headers.get("link") || res.headers.get("Link");
    const pagination = parseLinkHeader(link);
    const totalHeader = res.headers.get("x-total") || res.headers.get("X-Total");
    const total = totalHeader ? parseInt(totalHeader, 10) : null;
    const items = await res.json();
    const totalPages = pagination.lastPage || (total ? Math.ceil(total / perPage) : null);
    const hasPrev = pagination.hasPrev || (typeof totalPages === "number" ? page > 1 : false);
    const hasNext = pagination.hasNext || (typeof totalPages === "number" ? page < totalPages : false);
    return { items, pagination: { ...pagination, total, totalPages, hasPrev, hasNext, page, perPage } };
  },
  // CS:GO matches
  csgoMatches: async (kind = "running", { page = 1, perPage = 10, tier, tiers } = {}) => {
    const allowed = new Set(["running", "past", "upcoming"]);
    const key = String(kind).toLowerCase();
    if (!allowed.has(key)) throw new Error("Unsupported matches kind");
    const url = new URL(API_BASE + `/csgo/matches/${key}`);
    url.searchParams.set("page", page);
    url.searchParams.set("per_page", perPage);

    // NOTE: The matches resource doesn't support filter[tier].
    // When a tier is requested, pre-filter by fetching tournaments of that tier
    // and then filter matches by tournament_id.
    const tierVal = Array.isArray(tiers) ? tiers.join(",") : (tier || "");
    if (tierVal) {
      try {
        const { items: tnts } = await PandaScore.csgoTournaments({ page: 1, perPage: 50, tier: tierVal });
        const ids = (Array.isArray(tnts) ? tnts : []).map(t => t?.id).filter(Boolean);
        if (ids.length > 0) {
          url.searchParams.set("filter[tournament_id]", ids.slice(0, 50).join(","));
        } else {
          // No tournaments of this tier -> early return empty page
          return { items: [], pagination: { page, perPage, total: 0, totalPages: 0, hasPrev: false, hasNext: false } };
        }
      } catch (_) {
        // If tournaments lookup fails, fall back to no matches
        return { items: [], pagination: { page, perPage, total: 0, totalPages: 0, hasPrev: false, hasNext: false } };
      }
    }
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    });
    if (!res.ok) {
      let detail = "";
      try { detail = await res.text(); } catch (_) {}
      throw new Error(`PandaScore csgo matches ${key} error ${res.status}: ${detail}`);
    }
    const link = res.headers.get("link") || res.headers.get("Link");
    const pagination = parseLinkHeader(link);
    const totalHeader = res.headers.get("x-total") || res.headers.get("X-Total");
    const total = totalHeader ? parseInt(totalHeader, 10) : null;
    const items = await res.json();
    const totalPages = pagination.lastPage || (total ? Math.ceil(total / perPage) : null);
    const hasPrev = pagination.hasPrev || (typeof totalPages === "number" ? page > 1 : false);
    const hasNext = pagination.hasNext || (typeof totalPages === "number" ? page < totalPages : false);
    return { items, pagination: { ...pagination, total, totalPages, hasPrev, hasNext, page, perPage } };
  },
};

function parseLinkHeader(link) {
  // Parses RFC5988 Link headers like: <url?page=2>; rel="next", <...>; rel="prev"
  const out = { hasNext: false, hasPrev: false, nextPage: null, prevPage: null, lastPage: null };
  if (!link) return out;
  const parts = link.split(",");
  for (const p of parts) {
    const match = p.match(/<([^>]+)>;\s*rel="(\w+)"/i);
    if (!match) continue;
    const url = new URL(match[1]);
    const rel = match[2];
    const pageStr = url.searchParams.get("page");
    const pageNum = pageStr ? parseInt(pageStr, 10) : null;
    if (rel === "next") { out.hasNext = true; out.nextPage = pageNum; }
    if (rel === "prev") { out.hasPrev = true; out.prevPage = pageNum; }
    if (rel === "last") { out.lastPage = pageNum; }
  }
  return out;
}
