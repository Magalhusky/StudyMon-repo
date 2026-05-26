import React from 'react';
import { motion } from 'framer-motion';
import { ELEMENT_CONFIG, getPetVisual, getEvolutionName } from '@/lib/gameUtils';
import { cn } from '@/lib/utils';
import { Heart, Zap, Shield } from 'lucide-react';

export default function PetDisplay({ pet, size = 'lg' }) {
  if (!pet) return null;

  const element = ELEMENT_CONFIG[pet.element] || ELEMENT_CONFIG.fire;
  const visual = getPetVisual(pet.element, pet.evolution_stage || 1);
  const evoName = getEvolutionName(pet.evolution_stage || 1);

  const sizes = {
    sm: { container: 'w-24 h-24', emoji: 'text-4xl', ring: 'w-28 h-28' },
    md: { container: 'w-32 h-32', emoji: 'text-5xl', ring: 'w-36 h-36' },
    lg: { container: 'w-44 h-44', emoji: 'text-7xl', ring: 'w-48 h-48' },
  };
  const s = sizes[size] || sizes.lg;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Pet orb */}
      <div className="relative">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          {/* Outer glow ring */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-xl opacity-30",
            element.bg
          )} style={{ transform: 'scale(1.3)' }} />
          
          {/* Ring */}
          <div className={cn(
            s.ring,
            "rounded-full border-2 flex items-center justify-center mx-auto",
            element.border, element.bg
          )}>
            <div className={cn(
              s.container,
              "rounded-full bg-card/80 backdrop-blur flex items-center justify-center",
              `shadow-xl ${element.glow}`
            )}>
              <span className={s.emoji}>{visual}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pet info */}
      <div className="text-center">
        <h3 className="font-heading text-lg font-bold tracking-wide">{pet.name}</h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", element.bg, element.color)}>
            {element.emoji} {element.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {evoName}
          </span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <Heart className="w-3 h-3 text-red-400" />
          <span className="text-muted-foreground">{pet.energy || 100}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-muted-foreground">Lv.{pet.level || 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-blue-400" />
          <span className="text-muted-foreground">{pet.power || 10}</span>
        </div>
      </div>
    </div>
  );
}