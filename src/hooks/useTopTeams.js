import { useEffect, useState } from "react";
import { PandaScore } from "../services/pandascore";

export function useTopTeams({ tier = 's', tiers, kinds = ['running', 'past'], pages = 1, perPage = 50 } = {}) {
  const [data, setData] = useState([]); // array of { team, count }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await PandaScore.topTeamsByTier({ tier, tiers, kinds, pages, perPage });
        if (!cancelled) setData(res.items || []);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [tier, JSON.stringify(tiers || []), JSON.stringify(kinds), pages, perPage]);

  return { data, loading, error };
}
