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

export default function Pagination({ page, totalPages, hasPrev, hasNext, onChange }) {
  const pages = buildPages(page || 1, totalPages || 1);

  return (
    <div className="flex items-center justify-between pt-2">
      <button
        className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 disabled:opacity-40"
        onClick={() => onChange?.(Math.max(1, (page || 1) - 1))}
        disabled={!hasPrev}
      >
        Précédent
      </button>
      <div className="flex items-center gap-1 text-sm">
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`e${idx}`} className="px-2 text-white/40">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange?.(p)}
              className={`px-2.5 py-1 rounded-md border border-white/10 ${p === page ? "bg-white/15" : "bg-white/5 hover:bg-white/10"}`}
            >
              {p}
            </button>
          )
        )}
      </div>
      <button
        className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 disabled:opacity-40"
        onClick={() => onChange?.((page || 1) + 1)}
        disabled={!hasNext}
      >
        Suivant
      </button>
    </div>
  );
}
