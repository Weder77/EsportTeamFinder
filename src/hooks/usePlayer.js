import { useEffect, useState } from "react";
import { PandaScore } from "../services/pandascore";

export function usePlayer(idOrSlug) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!idOrSlug) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const json = await PandaScore.player(idOrSlug);
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [idOrSlug]);

  return { data, loading, error };
}

