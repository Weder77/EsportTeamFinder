import React from "react";

export default function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-white/60">
      {Icon ? <Icon className="w-4 h-4" /> : null}
      <span>{children}</span>
    </div>
  );
}

