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
  // Teams list (paginated)
  teams: async ({ page = 1, perPage = 10 } = {}) => {
    // We need pagination info from headers
    if (!TOKEN) throw new Error("Missing VITE_PANDASCORE_TOKEN env variable");
    const url = new URL(API_BASE + "/teams");
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

  // Example placeholder removed (global /players is not available on all plans)

  // Players for a given team (current roster)
  teamPlayers: async ({ teamIdOrSlug, page = 1, perPage = 50 } = {}) => {
    if (!teamIdOrSlug) throw new Error("teamIdOrSlug is required");
    const url = new URL(API_BASE + `/teams/${teamIdOrSlug}/players`);
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
