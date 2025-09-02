import React from "react";
import TeamCard from "./TeamCard";

export default function TeamList({ teams, selectedTeamId, onSelect }) {
  return (
    <div className="grid gap-3">
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          selected={selectedTeamId === team.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

