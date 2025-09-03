import { useEffect, useState } from "react";
import { PandaScore } from "../services/pandascore";

export function useMatches(kind, { page = 1, perPage = 10, tier, tiers } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState({ page, perPage, hasPrev: false, hasNext: false, totalPages: null });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const { items, pagination } = await PandaScore.csgoMatches(kind, { page, perPage, tier, tiers });
        if (!cancelled) {
          setData(Array.isArray(items) ? items : []);
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
  }, [kind, page, perPage, tier, JSON.stringify(tiers || [])]);

  return { data, loading, error, pageInfo };
}
