import React from 'react';
import { Flame, Clock, Coins, Swords, Trophy } from 'lucide-react';

const stats = [
  { key: 'streak_days', label: 'Streak', icon: Flame, color: 'text-orange-400', suffix: ' dias' },
  { key: 'total_focus_minutes', label: 'Foco Total', icon: Clock, color: 'text-blue-400', format: (v) => v >= 60 ? `${Math.floor(v/60)}h ${v%60}m` : `${v}m` },
  { key: 'gold', label: 'Ouro', icon: Coins, color: 'text-yellow-400', suffix: '' },
  { key: 'battles_won', label: 'Vitórias', icon: Trophy, color: 'text-purple-400', suffix: '' },
];

export default function StatsGrid({ pet }) {
  if (!pet) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(stat => {
        const value = pet[stat.key] || 0;
        const display = stat.format ? stat.format(value) : `${value}${stat.suffix || ''}`;
        return (
          <div key={stat.key} className="bg-secondary/40 rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="font-heading text-lg font-bold">{display}</p>
          </div>
        );
      })}
    </div>
  );
}