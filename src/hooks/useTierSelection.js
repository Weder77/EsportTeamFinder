import { useEffect, useState } from "react";

const KEY = "tierSelection";

export function useTierSelection(defaultTiers = []) {
  const [tiers, setTiers] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (_) {}
    return defaultTiers;
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(tiers)); } catch (_) {}
  }, [tiers]);

  function toggle(tierCode) {
    setTiers((prev) => {
      const has = prev.includes(tierCode);
      if (has) return prev.filter((t) => t !== tierCode);
      return [...prev, tierCode];
    });
  }

  function setOnly(tierCode) {
    setTiers([tierCode]);
  }

  return { tiers, setTiers, toggle, setOnly };
}

