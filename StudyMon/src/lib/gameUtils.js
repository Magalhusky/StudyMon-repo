// XP calculation based on focus minutes and streak
export function calculateXP(minutes, streakDays) {
  const baseXP = Math.floor(minutes * 1.67); // ~50 XP per 30 min
  const streakMultiplier = 1 + (Math.min(streakDays, 30) * 0.03); // max +90% at 30 days
  return Math.floor(baseXP * streakMultiplier);
}

export function calculateGold(minutes) {
  return Math.floor(minutes * 0.5);
}

export function getXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function getEvolutionStage(level) {
  if (level >= 30) return 4; // Legendary
  if (level >= 15) return 3; // Adult
  if (level >= 5) return 2;  // Teen
  return 1;                   // Baby
}

export function getEvolutionName(stage) {
  const names = { 1: 'Filhote', 2: 'Juvenil', 3: 'Adulto', 4: 'Lendário' };
  return names[stage] || 'Filhote';
}

export function getPower(level, totalFocusMinutes, battlesWon) {
  return Math.floor(10 + (level * 3) + (totalFocusMinutes * 0.05) + (battlesWon * 2));
}

export const ELEMENT_CONFIG = {
  fire: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40', glow: 'shadow-orange-500/30', emoji: '🔥', label: 'Fogo' },
  water: { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40', glow: 'shadow-blue-500/30', emoji: '💧', label: 'Água' },
  shadow: { color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40', glow: 'shadow-purple-500/30', emoji: '🌑', label: 'Sombra' },
  nature: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40', glow: 'shadow-green-500/30', emoji: '🌿', label: 'Natureza' },
  electric: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', glow: 'shadow-yellow-500/30', emoji: '⚡', label: 'Elétrico' },
};

export const CATEGORY_CONFIG = {
  study: { emoji: '📚', label: 'Estudar' },
  work: { emoji: '💻', label: 'Trabalhar' },
  exercise: { emoji: '🏋️', label: 'Exercício' },
  reading: { emoji: '📖', label: 'Leitura' },
  meditation: { emoji: '🧘', label: 'Meditação' },
  creative: { emoji: '🎨', label: 'Criativo' },
  other: { emoji: '✨', label: 'Outro' },
};

// Evolution level thresholds
export const EVOLUTION_LEVELS = [5, 15, 30]; // levels that trigger evolution

// Pet visual based on element and evolution stage
// Each stage has sub-visuals based on how far into the stage the pet is
export function getPetVisual(element, evolutionStage, level) {
  const visuals = {
    fire: {
      1: ['🥚', '🐣', '🐥'],           // lv 1-4
      2: ['🦊', '🦊', '🐺'],            // lv 5-14
      3: ['🐲', '🐉', '🔴'],            // lv 15-29
      4: ['🔥', '🌋', '☀️'],            // lv 30+
    },
    water: {
      1: ['🥚', '🐣', '🐟'],
      2: ['🐬', '🐬', '🦈'],
      3: ['🐋', '🐋', '🌊'],
      4: ['🌊', '🌀', '💧'],
    },
    shadow: {
      1: ['🥚', '🐣', '🦉'],
      2: ['🦇', '🦇', '🕷️'],
      3: ['🐺', '🐺', '🖤'],
      4: ['👾', '💀', '🌑'],
    },
    nature: {
      1: ['🥚', '🐣', '🌱'],
      2: ['🦎', '🦎', '🐢'],
      3: ['🦌', '🦌', '🌲'],
      4: ['🌳', '🌴', '🌿'],
    },
    electric: {
      1: ['🥚', '🐣', '🐹'],
      2: ['⚡', '🐭', '🐱'],
      3: ['🐯', '🐯', '🦁'],
      4: ['⚡', '🌩️', '☄️'],
    },
  };

  const stage = evolutionStage || 1;
  const stageVisuals = visuals[element]?.[stage] || ['🥚', '🐣', '🐥'];

  // Determine sub-index within the stage based on level progression
  const lvl = level || 1;
  let subIdx = 0;
  if (stage === 1) subIdx = lvl >= 3 ? 2 : lvl >= 2 ? 1 : 0;
  else if (stage === 2) subIdx = lvl >= 12 ? 2 : lvl >= 8 ? 1 : 0;
  else if (stage === 3) subIdx = lvl >= 25 ? 2 : lvl >= 20 ? 1 : 0;
  else if (stage === 4) subIdx = lvl >= 50 ? 2 : lvl >= 40 ? 1 : 0;

  return stageVisuals[subIdx];
}