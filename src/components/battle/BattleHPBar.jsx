import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function BattleHPBar({ current, max, label, flip = false }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={cn('space-y-1', flip && 'text-right')}>
      <div className={cn('flex items-center gap-2 text-xs font-medium', flip && 'flex-row-reverse')}>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-heading">{Math.max(0, current)}<span className="text-muted-foreground">/{max}</span></span>
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full transition-colors', color)}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}