import React from 'react';
import { Crown, Medal, Zap, Flame, Clock, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ELEMENT_CONFIG, getPetVisual } from '@/lib/gameUtils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

function getRankIcon(index) {
  if (index === 0) return <Crown className="w-4 h-4 text-yellow-400" />;
  if (index === 1) return <Medal className="w-4 h-4 text-gray-300" />;
  if (index === 2) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="w-4 h-4 flex items-center justify-center text-xs font-heading font-bold text-muted-foreground">#{index + 1}</span>;
}

function getRankBg(index) {
  if (index === 0) return 'border-yellow-500/40 bg-yellow-500/5';
  if (index === 1) return 'border-gray-400/30 bg-gray-400/5';
  if (index === 2) return 'border-amber-600/30 bg-amber-600/5';
  return 'border-border/50';
}

export default function GroupLeaderboard({ members, myPetId }) {
  const sorted = [...members].sort((a, b) => {
    if ((b.level || 1) !== (a.level || 1)) return (b.level || 1) - (a.level || 1);
    return (b.xp || 0) - (a.xp || 0);
  });

  return (
    <div className="space-y-2">
      {sorted.map((pet, index) => {
        const el = ELEMENT_CONFIG[pet.element] || ELEMENT_CONFIG.fire;
        const visual = getPetVisual(pet.element, pet.evolution_stage || 1);
        const isMe = pet.id === myPetId;

        return (
          <motion.div
            key={pet.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cn('p-3 border flex items-center gap-3', getRankBg(index), isMe && 'ring-1 ring-primary/50')}>
              <div className="flex-shrink-0 w-5 flex items-center justify-center">
                {getRankIcon(index)}
              </div>

              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xl border flex-shrink-0', el.bg, el.border)}>
                {visual}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm truncate">{pet.name}</p>
                  {isMe && <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full">você</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{pet.created_by?.split('@')[0]}</p>
              </div>

              <div className="flex items-center gap-3 text-xs flex-shrink-0">
                <div className="text-center hidden sm:block">
                  <p className="font-heading font-bold text-sm">{pet.level || 1}</p>
                  <p className="text-muted-foreground flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />Lv</p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="font-heading font-bold text-sm">{pet.streak_days || 0}</p>
                  <p className="text-muted-foreground flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />Streak</p>
                </div>
                <div className="text-center">
                  <p className="font-heading font-bold text-sm text-primary">{pet.power || 10}</p>
                  <p className="text-muted-foreground flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" />Poder</p>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}