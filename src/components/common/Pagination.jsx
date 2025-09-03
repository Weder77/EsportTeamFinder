import React from "react";

function buildPages(current, total) {
  const pages = [];
  const cur = Math.max(1, Math.min(total || 1, current || 1));
  const tot = Math.max(1, total || 1);

  if (tot <= 7) {
    for (let i = 1; i <= tot; i++) pages.push(i);
    return pages;
  }

  const neighbors = 1; // how many pages around current
  const start = Math.max(2, cur - neighbors);
  const end = Math.min(tot - 1, cur + neighbors);

  pages.push(1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < tot - 1) pages.push("...");
  pages.push(tot);

  return pages;
}

export default function Pagination({ page, totalPages, hasPrev, hasNext, onChange, arrowsOnly = false, neonActive = false }) {
  const pages = buildPages(page || 1, totalPages || 1);

  if (arrowsOnly) {
    return (
      <div className="flex items-center justify-center gap-2 pt-2">
        {hasPrev ? (
          <button
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5"
            onClick={() => onChange?.(Math.max(1, (page || 1) - 1))}
          >
            &lt;
          </button>
        ) : null}
        {hasNext ? (
          <button
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5"
            onClick={() => onChange?.((page || 1) + 1)}
          >
            &gt;
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between pt-2">
      {hasPrev ? (
        <button
          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5"
          onClick={() => onChange?.(Math.max(1, (page || 1) - 1))}
        >
          Précédent
        </button>
      ) : <span />}
      <div className="flex items-center gap-1 text-sm">
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`e${idx}`} className="px-2 text-white/40">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange?.(p)}
              className={`px-2.5 py-1 rounded-md border ${
                p === page
                  ? neonActive
                    ? "border-fuchsia-500/60 bg-white/10 text-white font-semibold shadow-[0_0_8px_rgba(168,85,247,0.5),0_0_18px_rgba(168,85,247,0.35)]"
                    : "border-fuchsia-500/40 bg-white/15 text-white font-semibold"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>
      {hasNext ? (
        <button
          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5"
          onClick={() => onChange?.((page || 1) + 1)}
        >
          Suivant
        </button>
      ) : <span />}
    </div>
  );
}
