import React from 'react';
import { cn } from '@/lib/utils';
import { ELEMENT_CONFIG } from '@/lib/gameUtils';

export default function SkillSelector({ skills, onSelect, disabled, element }) {
  const el = ELEMENT_CONFIG[element] || ELEMENT_CONFIG.fire;

  return (
    <div className="grid grid-cols-2 gap-2">
      {skills.map(skill => (
        <button
          key={skill.id}
          onClick={() => !disabled && onSelect(skill)}
          disabled={disabled}
          className={cn(
            'relative flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-all',
            'hover:scale-[1.02] active:scale-95',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-secondary/60',
            el.border, el.bg
          )}
        >
          <div className="flex items-center gap-1.5 w-full">
            <span className="text-lg">{skill.emoji}</span>
            <span className="font-medium text-sm truncate">{skill.name}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {skill.power > 0
              ? <span className="text-red-400 font-heading">POW {skill.power}</span>
              : <span className={cn('font-heading', el.color)}>EFEITO</span>
            }
            <span>· ACC {skill.accuracy}%</span>
            <span>· PP {skill.pp}</span>
          </div>
        </button>
      ))}
    </div>
  );
}