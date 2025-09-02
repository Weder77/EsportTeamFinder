import React from "react";
import TrophyCard from "./TrophyCard";

export default function TrophyGrid({ trophies = [], onSelect }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {trophies.map((t) => (
        <TrophyCard key={t.id} trophy={t} onClick={onSelect} />
      ))}
    </div>
  );
}

