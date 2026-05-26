import React, { useState, useCallback } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Swords, RotateCcw, Bot, Users, Shield, Zap, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ELEMENT_CONFIG, getPetVisual } from '@/lib/gameUtils';
import { BOTS, DIFFICULTY_COLORS } from '@/lib/botData';
import { getMaxHP, calcDamage, doesHit, getSkillsForElement } from '@/lib/battleEngine';
import BattleArena from '@/components/battle/BattleArena';
import SkillSelector from '@/components/battle/SkillSelector';
import BattleLog from '@/components/battle/BattleLog';
import { cn } from '@/lib/utils';

// ─── Initial battle state ──────────────────────────────────────────────────────
function initBattle(pet, opp) {
  const myMax = getMaxHP(pet.level, pet.power);
  const oppMax = getMaxHP(opp.level || opp.level, opp.power);
  return {
    myHP: myMax, myMaxHP: myMax,
    oppHP: oppMax, oppMaxHP: oppMax,
    myBoost: false, myEvading: false, myStunned: false,
    oppBoost: false, oppEvading: false, oppStunned: false,
    turn: 'player', // 'player' | 'enemy' | 'result'
    winner: null,
    log: [`A batalha começa! ${pet.name} vs ${opp.name}!`],
  };
}

// ─── Enemy AI: pick a skill ────────────────────────────────────────────────────
function pickEnemySkill(skills, oppHP, oppMaxHP) {
  // Heal if low HP and heal available
  const healSkill = skills.find(s => s.effect === 'heal');
  if (healSkill && oppHP < oppMaxHP * 0.35 && Math.random() > 0.4) return healSkill;
  // Sometimes boost
  const boostSkill = skills.find(s => s.effect === 'boost');
  if (boostSkill && Math.random() < 0.15) return boostSkill;
  // Otherwise weighted by power
  const attacks = skills.filter(s => s.power > 0);
  return attacks[Math.floor(Math.random() * attacks.length)];
}

export default function Battle() {
  const [phase, setPhase] = useState('select'); // select | battle | result
  const [opponent, setOpponent] = useState(null);
  const [isBot, setIsBot] = useState(false);
  const [bs, setBs] = useState(null); // battle state
  const [shakeMe, setShakeMe] = useState(false);
  const [shakeOpp, setShakeOpp] = useState(false);
  const [floatingText, setFloatingText] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const queryClient = useQueryClient();

  const { data: pets } = useQuery({ queryKey: ['my-pet'], queryFn: () => appClient.entities.FocusPet.list(), initialData: [] });
  const pet = pets[0];
  const mySkills = pet ? getSkillsForElement(pet.element) : [];

  const { data: allPets } = useQuery({ queryKey: ['all-pets'], queryFn: () => appClient.entities.FocusPet.list('-level', 50), initialData: [] });
  const pvpOpponents = allPets.filter(p => p.id !== pet?.id);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const showFloat = (text, side, type) => {
    setFloatingText({ text, side, type, key: Date.now() });
    setTimeout(() => setFloatingText(null), 1100);
  };

  const triggerShake = (side) => {
    if (side === 'me') { setShakeMe(true); setTimeout(() => setShakeMe(false), 450); }
    else { setShakeOpp(true); setTimeout(() => setShakeOpp(false), 450); }
  };

  // ── Apply a skill (by either player) ─────────────────────────────────────────
  const applySkill = useCallback((state, skill, byPlayer) => {
    const newState = { ...state, log: [...state.log] };

    const attackerName = byPlayer ? pet.name : opponent?.name;
    const defenderName = byPlayer ? opponent?.name : pet.name;
    const attackerPower = byPlayer ? (pet.power || 10) : (opponent?.power || 10);

    newState.log.push(`${attackerName} usou ${skill.emoji} ${skill.name}!`);

    // Evade check
    const evading = byPlayer ? state.oppEvading : state.myEvading;
    const hit = doesHit(skill.accuracy, evading);

    // Reset evade after check
    if (byPlayer) newState.oppEvading = false;
    else newState.myEvading = false;

    if (!hit) {
      newState.log.push(`Mas errou! 💨`);
      return newState;
    }

    // Effects
    if (skill.effect === 'heal') {
      const healAmt = Math.floor(30 + attackerPower * 0.3);
      if (byPlayer) {
        newState.myHP = Math.min(state.myMaxHP, state.myHP + healAmt);
        showFloat(`+${healAmt} HP`, 'left', 'heal');
      } else {
        newState.oppHP = Math.min(state.oppMaxHP, state.oppHP + healAmt);
        showFloat(`+${healAmt} HP`, 'right', 'heal');
      }
      newState.log.push(`${attackerName} recuperou ${healAmt} HP! 💚`);
      return newState;
    }

    if (skill.effect === 'boost') {
      if (byPlayer) newState.myBoost = true;
      else newState.oppBoost = true;
      newState.log.push(`${attackerName} aumentou seu poder! ⬆️`);
      showFloat('BOOST!', byPlayer ? 'left' : 'right', 'boost');
      return newState;
    }

    if (skill.effect === 'evade') {
      if (byPlayer) newState.myEvading = true;
      else newState.oppEvading = true;
      newState.log.push(`${attackerName} se preparou para esquivar! 💨`);
      return newState;
    }

    if (skill.effect === 'stun') {
      if (byPlayer) { newState.oppStunned = true; newState.log.push(`${defenderName} foi paralisado! ⚡`); }
      else { newState.myStunned = true; newState.log.push(`${defenderName} foi paralisado! ⚡`); }
      return newState;
    }

    // Damage
    const boost = byPlayer ? state.myBoost : state.oppBoost;
    const dmg = calcDamage(attackerPower, skill, boost);
    if (byPlayer) { newState.myBoost = false; newState.oppHP = Math.max(0, state.oppHP - dmg); triggerShake('opp'); showFloat(`-${dmg}`, 'right', 'damage'); }
    else { newState.oppBoost = false; newState.myHP = Math.max(0, state.myHP - dmg); triggerShake('me'); showFloat(`-${dmg}`, 'left', 'damage'); }

    newState.log.push(`Causou ${dmg} de dano!`);

    // Check KO
    if (byPlayer && newState.oppHP <= 0) {
      newState.log.push(`${opponent?.name} foi derrotado! 🏆`);
      newState.turn = 'result'; newState.winner = 'player';
    } else if (!byPlayer && newState.myHP <= 0) {
      newState.log.push(`${pet?.name} foi derrotado... 💔`);
      newState.turn = 'result'; newState.winner = 'enemy';
    }

    return newState;
  }, [pet, opponent]);

  // ── Player picks a skill ──────────────────────────────────────────────────────
  const handleSkillSelect = useCallback(async (skill) => {
    if (!bs || bs.turn !== 'player' || waiting) return;
    setWaiting(true);

    let state = { ...bs };

    // Stun check
    if (state.myStunned) {
      state.myStunned = false;
      state.log = [...state.log, `${pet.name} está paralisado e não pode agir! ⚡`];
      setBs({ ...state });
      await new Promise(r => setTimeout(r, 900));
    } else {
      state = applySkill(state, skill, true);
      setBs({ ...state });
      await new Promise(r => setTimeout(r, 800));
    }

    if (state.turn === 'result') {
      await finalizeBattle(state.winner === 'player');
      setWaiting(false);
      return;
    }

    // Enemy turn
    state = { ...state };
    const enemySkills = getSkillsForElement(opponent.element);
    const enemySkill = pickEnemySkill(enemySkills, state.oppHP, state.oppMaxHP);

    await new Promise(r => setTimeout(r, 600));

    if (state.oppStunned) {
      state.oppStunned = false;
      state.log = [...state.log, `${opponent.name} está paralisado e perde o turno! ⚡`];
      setBs({ ...state, turn: 'player' });
    } else {
      state = applySkill(state, enemySkill, false);
      state.turn = state.turn === 'result' ? 'result' : 'player';
      setBs({ ...state });
    }

    if (state.turn === 'result') {
      await finalizeBattle(state.winner === 'player');
    }

    setWaiting(false);
  }, [bs, waiting, pet, opponent, applySkill]);

  // ── Finalize and save ─────────────────────────────────────────────────────────
  const finalizeBattle = async (won) => {
    setPhase('result');
    if (won && pet) {
      const xpReward = isBot ? (opponent?.reward_xp || 30) : 30;
      const goldReward = isBot ? (opponent?.reward_gold || 20) : 20;
      await appClient.entities.FocusPet.update(pet.id, {
        battles_won: (pet.battles_won || 0) + 1,
        gold: (pet.gold || 0) + goldReward,
        xp: (pet.xp || 0) + xpReward,
      });
      queryClient.invalidateQueries({ queryKey: ['my-pet'] });
    }
  };

  const startBattle = (opp, bot) => {
    setOpponent(opp);
    setIsBot(bot);
    setBs(initBattle(pet, opp));
    setPhase('battle');
  };

  const resetBattle = () => {
    setPhase('select');
    setOpponent(null);
    setBs(null);
  };

  if (!pet) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-wider"><span className="text-purple-400">Arena</span> de Batalha</h1>
        <Card className="p-12 bg-card border-border/50 text-center"><p className="text-muted-foreground">Crie um pet primeiro para batalhar!</p></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-wider"><span className="text-purple-400">Arena</span> de Batalha</h1>
        <p className="text-sm text-muted-foreground mt-1">Combate por turnos — escolha sua habilidade!</p>
      </div>

      <AnimatePresence mode="wait">

        {/* ── SELECT OPPONENT ─────────────────────────────────────────────────── */}
        {phase === 'select' && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* My pet */}
            <Card className="p-4 mb-4 bg-card border-primary/30 border">
              <div className="flex items-center gap-3">
                <PetAvatar pet={pet} />
                <div className="flex-1">
                  <p className="font-medium">{pet.name} <span className="text-xs text-muted-foreground">(Você)</span></p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" />Lv.{pet.level || 1}</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-cyan-400" />Poder: {pet.power || 10}</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-400" />{pet.battles_won || 0} vitórias</span>
                  </div>
                </div>
              </div>
            </Card>

            <Tabs defaultValue="bots">
              <TabsList className="mb-4 bg-secondary/50">
                <TabsTrigger value="bots" className="flex items-center gap-1.5"><Bot className="w-4 h-4" /> Bots</TabsTrigger>
                <TabsTrigger value="pvp" className="flex items-center gap-1.5"><Users className="w-4 h-4" /> PvP</TabsTrigger>
              </TabsList>

              <TabsContent value="bots" className="space-y-3">
                <p className="text-xs text-muted-foreground">Bots usam suas próprias habilidades elementais em batalhas por turnos.</p>
                <div className="grid gap-3">
                  {BOTS.map(bot => {
                    const el = ELEMENT_CONFIG[bot.element];
                    const dc = DIFFICULTY_COLORS[bot.difficulty];
                    return (
                      <Card key={bot.id} className="p-4 bg-card border-border/50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <PetAvatar pet={bot} isBot />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{bot.name}</p>
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', dc.bg, dc.text, dc.border)}>{bot.difficultyLabel}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{el.emoji} {el.label} · Lv.{bot.level} · HP: {getMaxHP(bot.level, bot.power)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-primary font-heading">+{bot.reward_xp} XP</span>
                            <span className="text-yellow-400 font-heading">+{bot.reward_gold} 🪙</span>
                          </div>
                          <Button size="sm" onClick={() => startBattle(bot, true)} className={cn('font-heading text-xs tracking-wider', bot.difficulty === 'expert' ? 'bg-red-600 hover:bg-red-700' : bot.difficulty === 'hard' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-600 hover:bg-purple-700')}>
                            <Swords className="w-3 h-3 mr-1" />LUTAR
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="pvp" className="space-y-3">
                {pvpOpponents.length === 0 ? (
                  <Card className="p-10 bg-card border-border/50 text-center">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhum oponente disponível ainda.</p>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {pvpOpponents.map(opp => {
                      const el = ELEMENT_CONFIG[opp.element] || ELEMENT_CONFIG.fire;
                      return (
                        <Card key={opp.id} className="p-4 bg-card border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <PetAvatar pet={opp} />
                            <div>
                              <p className="font-medium">{opp.name}</p>
                              <p className="text-xs text-muted-foreground">{el.emoji} {el.label} · Lv.{opp.level || 1} · HP: {getMaxHP(opp.level, opp.power)}</p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => startBattle(opp, false)} className="font-heading text-xs tracking-wider bg-purple-600 hover:bg-purple-700">
                            <Swords className="w-3 h-3 mr-1" />LUTAR
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* ── BATTLE ──────────────────────────────────────────────────────────── */}
        {phase === 'battle' && bs && (
          <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <BattleArena
              myPet={pet} opponent={opponent}
              myHP={bs.myHP} myMaxHP={bs.myMaxHP}
              oppHP={bs.oppHP} oppMaxHP={bs.oppMaxHP}
              isBot={isBot}
              shakeMe={shakeMe} shakeOpp={shakeOpp}
              floatingText={floatingText}
            />

            <BattleLog lines={bs.log} />

            <div>
              <p className="text-xs text-muted-foreground mb-2 font-heading tracking-wider">
                {waiting ? 'Aguarde...' : 'ESCOLHA UMA HABILIDADE'}
              </p>
              <SkillSelector
                skills={mySkills}
                onSelect={handleSkillSelect}
                disabled={waiting || bs.turn !== 'player'}
                element={pet.element}
              />
            </div>
          </motion.div>
        )}

        {/* ── RESULT ──────────────────────────────────────────────────────────── */}
        {phase === 'result' && bs && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Card className="p-8 bg-card border-border/50 flex flex-col items-center space-y-5">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }} className="text-6xl">
                {bs.winner === 'player' ? '🏆' : '💔'}
              </motion.div>
              <h2 className="font-heading text-3xl font-bold">
                {bs.winner === 'player'
                  ? <span className="text-yellow-400">VITÓRIA!</span>
                  : <span className="text-destructive">DERROTA</span>
                }
              </h2>
              {bs.winner === 'player' && (
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="font-heading text-2xl font-bold text-primary">+{isBot ? opponent?.reward_xp : 30}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                  <div className="text-center">
                    <p className="font-heading text-2xl font-bold text-yellow-400">+{isBot ? opponent?.reward_gold : 20}</p>
                    <p className="text-xs text-muted-foreground">Ouro</p>
                  </div>
                </div>
              )}
              <BattleLog lines={bs.log} />
              <Button onClick={resetBattle} className="font-heading tracking-wider">
                <RotateCcw className="w-4 h-4 mr-2" />Voltar à Arena
              </Button>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

function PetAvatar({ pet, isBot = false }) {
  if (!pet) return null;
  const element = ELEMENT_CONFIG[pet.element] || ELEMENT_CONFIG.fire;
  const visual = getPetVisual(pet.element, pet.evolution_stage || 1);
  return (
    <div className="relative">
      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-2xl border', element.bg, element.border)}>{visual}</div>
      {isBot && <div className="absolute -bottom-1 -right-1 bg-secondary rounded-full p-0.5 border border-border"><Bot className="w-3 h-3 text-muted-foreground" /></div>}
    </div>
  );
}