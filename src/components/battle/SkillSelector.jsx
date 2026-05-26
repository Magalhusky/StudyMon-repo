import React from 'react';

export default function SkillSelector({ skills, onSelect, disabled }) {
  return (
    <div className="space-y-2">
      {skills?.map((skill) => (
        <button
          key={skill.name}
          onClick={() => onSelect(skill)}
          disabled={disabled}
          className="w-full p-3 bg-secondary hover:bg-secondary/80 rounded-lg text-left font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {skill.emoji} {skill.name}
        </button>
      ))}
    </div>
  );
}
