import { useEffect, useMemo, useRef, useState } from "react";
import { PandaScore } from "../services/pandascore";

export function usePlayerSearch(initial = "") {
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const canSearch = useMemo(() => (query || "").trim().length >= 3, [query]);

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setLoading(false);
      setError(null);
      if (controllerRef.current) controllerRef.current.abort();
      return;
    }
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { items } = await PandaScore.csgoPlayers({ page: 1, perPage: 10, search: query.trim() });
        setResults(Array.isArray(items) ? items : []);
      } catch (e) {
        if (e.name !== 'AbortError') setError(e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query, canSearch]);

  return { query, setQuery, results, loading, error, canSearch };
}

