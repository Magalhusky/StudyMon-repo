// ─── Skills per element ───────────────────────────────────────────────────────
export const SKILLS = {
  fire: [
    { id: 'ember',      name: 'Brasa',        power: 20, accuracy: 100, pp: 10, emoji: '🔥', description: 'Ataque de fogo básico.' },
    { id: 'flamethrower', name: 'Lançachamas', power: 45, accuracy: 85,  pp: 6,  emoji: '🌋', description: 'Jato de fogo intenso.' },
    { id: 'inferno',    name: 'Inferno',       power: 70, accuracy: 65,  pp: 3,  emoji: '💥', description: 'Explosão devastadora. Pode errar!' },
    { id: 'heat_up',    name: 'Aquecer',       power: 0,  accuracy: 100, pp: 5,  emoji: '⬆️', description: 'Aumenta seu poder de ataque.', effect: 'boost' },
  ],
  water: [
    { id: 'bubble',     name: 'Bolhas',        power: 18, accuracy: 100, pp: 10, emoji: '💧', description: 'Rajada de bolhas.' },
    { id: 'water_gun',  name: 'Pistola d\'Água', power: 40, accuracy: 90, pp: 6, emoji: '🌊', description: 'Jato de água preciso.' },
    { id: 'tsunami',    name: 'Tsunami',       power: 75, accuracy: 60,  pp: 3,  emoji: '🌀', description: 'Onda devastadora. Alta potência, baixa precisão.' },
    { id: 'heal',       name: 'Regenerar',     power: 0,  accuracy: 100, pp: 4,  emoji: '💚', description: 'Recupera HP.', effect: 'heal' },
  ],
  shadow: [
    { id: 'scratch',    name: 'Garra Sombria', power: 22, accuracy: 100, pp: 10, emoji: '🌑', description: 'Garra das trevas.' },
    { id: 'dark_pulse', name: 'Pulso Sombrio', power: 48, accuracy: 80,  pp: 6,  emoji: '👾', description: 'Onda de energia sombria.' },
    { id: 'void',       name: 'Abismo',        power: 80, accuracy: 55,  pp: 3,  emoji: '🕳️', description: 'Poder do vazio. Extremamente arriscado.' },
    { id: 'vanish',     name: 'Desaparecer',   power: 0,  accuracy: 100, pp: 4,  emoji: '💨', description: 'Esquiva do próximo ataque.', effect: 'evade' },
  ],
  nature: [
    { id: 'vine',       name: 'Chicote de Trepadeira', power: 20, accuracy: 100, pp: 10, emoji: '🌿', description: 'Ataque com trepadeira.' },
    { id: 'razor_leaf', name: 'Folha Afiada',  power: 42, accuracy: 88,  pp: 6,  emoji: '🍃', description: 'Folhas cortantes.' },
    { id: 'solar_beam', name: 'Raio Solar',    power: 72, accuracy: 62,  pp: 3,  emoji: '☀️', description: 'Absorve luz e dispara.' },
    { id: 'spore',      name: 'Esporo',        power: 0,  accuracy: 85,  pp: 5,  emoji: '🍄', description: 'Paralisa o oponente por 1 turno.', effect: 'stun' },
  ],
  electric: [
    { id: 'spark',      name: 'Faísca',        power: 20, accuracy: 100, pp: 10, emoji: '⚡', description: 'Choque elétrico rápido.' },
    { id: 'thunderbolt', name: 'Raio',         power: 50, accuracy: 82,  pp: 6,  emoji: '🌩️', description: 'Raio poderoso.' },
    { id: 'thunder',    name: 'Trovão',        power: 78, accuracy: 58,  pp: 3,  emoji: '⛈️', description: 'Potência máxima. Difícil de acertar.' },
    { id: 'charge',     name: 'Carregar',      power: 0,  accuracy: 100, pp: 5,  emoji: '🔋', description: 'Aumenta poder do próximo ataque.', effect: 'boost' },
  ],
};

// Max HP based on pet level and power
export function getMaxHP(level, power) {
  return Math.floor(50 + (level || 1) * 5 + (power || 10) * 0.5);
}

// Damage calculation
export function calcDamage(attackerPower, skill, boostActive) {
  if (!skill.power) return 0;
  const base = skill.power + Math.floor((attackerPower || 10) * 0.4);
  const variance = 0.85 + Math.random() * 0.3; // 85%–115%
  const boost = boostActive ? 1.5 : 1;
  return Math.max(1, Math.floor(base * variance * boost));
}

// Returns true if the move hits
export function doesHit(accuracy, evading = false) {
  if (evading) return false;
  return Math.random() * 100 < accuracy;
}

export function getSkillsForElement(element) {
  return SKILLS[element] || SKILLS.fire;
}