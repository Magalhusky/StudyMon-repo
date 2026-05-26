import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ELEMENT_CONFIG, getPetVisual } from '@/lib/gameUtils';
import { cn } from '@/lib/utils';
import BattleHPBar from './BattleHPBar';
import { Bot } from 'lucide-react';

function Fighter({ pet, hp, maxHp, isBot, shake, side }) {
  const el = ELEMENT_CONFIG[pet?.element] || ELEMENT_CONFIG.fire;
  const visual = getPetVisual(pet?.element, pet?.evolution_stage || 1);
  const flip = side === 'right';

  return (
    <div className={cn('flex flex-col gap-2 w-40', flip && 'items-end')}>
      <BattleHPBar current={hp} max={maxHp} label={pet?.name} flip={flip} />
      <motion.div
        animate={shake ? { x: flip ? [0, 12, -12, 8, -8, 0] : [0, -12, 12, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <div className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center text-4xl border-2',
          el.bg, el.border, flip ? 'ml-auto' : ''
        )}>
          {visual}
        </div>
        {isBot && (
          <div className="absolute -bottom-1 -right-1 bg-secondary rounded-full p-0.5 border border-border">
            <Bot className="w-3 h-3 text-muted-foreground" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function BattleArena({ myPet, opponent, myHP, myMaxHP, oppHP, oppMaxHP, isBot, shakeMe, shakeOpp, floatingText }) {
  return (
    <div className="relative flex items-end justify-between px-4 py-4 bg-secondary/20 rounded-2xl border border-border/50 min-h-[160px]">
      <Fighter pet={myPet} hp={myHP} maxHp={myMaxHP} isBot={false} shake={shakeMe} side="left" />

      {/* VS */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="font-heading text-xs text-muted-foreground/50 tracking-widest">VS</span>
      </div>

      {/* Floating damage text */}
      <AnimatePresence>
        {floatingText && (
          <motion.div
            key={floatingText.key}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={cn(
              'absolute font-heading font-bold text-lg pointer-events-none',
              floatingText.side === 'left' ? 'left-16' : 'right-16',
              floatingText.type === 'damage' ? 'text-red-400' : floatingText.type === 'heal' ? 'text-green-400' : 'text-yellow-400'
            )}
          >
            {floatingText.text}
          </motion.div>
        )}
      </AnimatePresence>

      <Fighter pet={opponent} hp={oppHP} maxHp={oppMaxHP} isBot={isBot} shake={shakeOpp} side="right" />
    </div>
  );
}