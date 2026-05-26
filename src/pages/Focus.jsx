import React, { useState, useEffect, useRef, useCallback } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import FocusTimerDisplay from '@/components/focus/FocusTimerDisplay';
import PetDisplay from '@/components/pet/PetDisplay';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square, RotateCcw, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateXP, calculateGold, getXPForLevel, getEvolutionStage, getPower, EVOLUTION_LEVELS } from '@/lib/gameUtils';
import { CATEGORY_CONFIG } from '@/lib/gameUtils';
import { toast } from 'sonner';
import LevelUpAnimation from '@/components/pet/LevelUpAnimation';
import EvolutionAnimation from '@/components/pet/EvolutionAnimation';
import { AnimatePresence as AP } from 'framer-motion';

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 25, label: '25 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
];

export default function Focus() {
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [earnedGold, setEarnedGold] = useState(0);
  const [levelUpAnim, setLevelUpAnim] = useState(null); // new level number
  const [evolutionAnim, setEvolutionAnim] = useState(null); // new stage number
  const [pendingAnimPet, setPendingAnimPet] = useState(null); // pet snapshot for evo anim
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: pets } = useQuery({
    queryKey: ['my-pet'],
    queryFn: () => appClient.entities.FocusPet.list(),
    initialData: [],
  });
  const pet = pets[0];

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => appClient.entities.FocusTask.list(),
    initialData: [],
  });

  const completeSession = useCallback(async () => {
    if (!pet) return;
    
    const elapsedSeconds = (duration * 60) - secondsLeft;
    const actualMinutes = Math.floor(elapsedSeconds / 60);
    const completed = secondsLeft <= 0;
    const xp = calculateXP(completed ? duration : actualMinutes, pet.streak_days || 0);
    const gold = calculateGold(completed ? duration : actualMinutes);

    setEarnedXP(xp);
    setEarnedGold(gold);
    setIsRunning(false);
    setSessionComplete(true);
    clearInterval(intervalRef.current);

    // Save session
    await appClient.entities.FocusSession.create({
      task_name: taskName || 'Sessão de Foco',
      duration_minutes: duration,
      actual_minutes: completed ? duration : actualMinutes,
      xp_earned: xp,
      gold_earned: gold,
      completed,
      failed: !completed,
      date: new Date().toISOString().split('T')[0],
    });

    // Update pet
    const newXP = (pet.xp || 0) + xp;
    const xpToNext = pet.xp_to_next_level || 100;
    let newLevel = pet.level || 1;
    let remainingXP = newXP;
    let nextLevelXP = xpToNext;

    const oldLevel = pet.level || 1;
    while (remainingXP >= nextLevelXP) {
      remainingXP -= nextLevelXP;
      newLevel++;
      nextLevelXP = getXPForLevel(newLevel);
    }

    const newTotalMinutes = (pet.total_focus_minutes || 0) + (completed ? duration : actualMinutes);
    const today = new Date().toISOString().split('T')[0];
    const lastFocus = pet.last_focus_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = pet.streak_days || 0;
    if (lastFocus === yesterday || !lastFocus) {
      newStreak = (pet.streak_days || 0) + (lastFocus !== today ? 1 : 0);
    } else if (lastFocus !== today) {
      newStreak = 1;
    }

    await appClient.entities.FocusPet.update(pet.id, {
      xp: remainingXP,
      xp_to_next_level: nextLevelXP,
      level: newLevel,
      evolution_stage: getEvolutionStage(newLevel),
      total_focus_minutes: newTotalMinutes,
      gold: (pet.gold || 0) + gold,
      streak_days: newStreak,
      last_focus_date: today,
      power: getPower(newLevel, newTotalMinutes, pet.battles_won || 0),
      energy: Math.max(0, (pet.energy || 100) - (completed ? 0 : 10)),
    });

    queryClient.invalidateQueries({ queryKey: ['my-pet'] });
    queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });

    // Trigger animations after save
    if (newLevel > oldLevel) {
      const newStage = getEvolutionStage(newLevel);
      const oldStage = getEvolutionStage(oldLevel);
      if (newStage > oldStage) {
        // Evolution takes priority — show after a tiny delay
        setPendingAnimPet({ ...pet, level: newLevel });
        setTimeout(() => setEvolutionAnim(newStage), 800);
      } else {
        setTimeout(() => setLevelUpAnim(newLevel), 800);
      }
    }
  }, [pet, duration, secondsLeft, taskName, queryClient]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, completeSession]);

  const startSession = () => {
    if (!taskName.trim()) {
      toast.error('Dê um nome à sua tarefa!');
      return;
    }
    setSecondsLeft(duration * 60);
    setIsRunning(true);
    setSessionComplete(false);
    startTimeRef.current = Date.now();
  };

  const stopSession = () => {
    completeSession();
  };

  const resetSession = () => {
    setIsRunning(false);
    setSessionComplete(false);
    setSecondsLeft(duration * 60);
    clearInterval(intervalRef.current);
  };

  return (
    <div className="space-y-6">
      <AP>
        {levelUpAnim && (
          <LevelUpAnimation key="lvlup" level={levelUpAnim} onDone={() => setLevelUpAnim(null)} />
        )}
        {evolutionAnim && pendingAnimPet && (
          <EvolutionAnimation key="evo" pet={pendingAnimPet} newStage={evolutionAnim} onDone={() => { setEvolutionAnim(null); setPendingAnimPet(null); }} />
        )}
      </AP>
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-wider">
          Modo <span className="text-primary">Foco</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Foque e evolua seu FocusMon</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2">
          <Card className="p-6 md:p-8 bg-card border-border/50 flex flex-col items-center">
            <AnimatePresence mode="wait">
              {sessionComplete ? (
                <SessionResult
                  key="result"
                  xp={earnedXP}
                  gold={earnedGold}
                  completed={secondsLeft <= 0}
                  onReset={resetSession}
                />
              ) : (
                <motion.div key="timer" className="w-full flex flex-col items-center space-y-6">
                  {!isRunning && (
                    <div className="w-full max-w-sm space-y-4">
                      <Input
                        placeholder="O que você vai focar? Ex: Estudar AWS"
                        value={taskName}
                        onChange={e => setTaskName(e.target.value)}
                        className="bg-secondary/50 text-center"
                      />
                      <Select value={String(duration)} onValueChange={v => { setDuration(Number(v)); setSecondsLeft(Number(v) * 60); }}>
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <FocusTimerDisplay
                    secondsLeft={secondsLeft}
                    totalSeconds={duration * 60}
                    isRunning={isRunning}
                    element={pet?.element}
                  />

                  <div className="flex gap-3">
                    {!isRunning ? (
                      <Button
                        onClick={startSession}
                        size="lg"
                        className="font-heading tracking-wider bg-primary hover:bg-primary/90 px-8"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        INICIAR
                      </Button>
                    ) : (
                      <Button
                        onClick={stopSession}
                        size="lg"
                        variant="destructive"
                        className="font-heading tracking-wider px-8"
                      >
                        <Square className="w-5 h-5 mr-2" />
                        PARAR
                      </Button>
                    )}
                  </div>

                  {isRunning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 px-4 py-2 rounded-full"
                    >
                      <AlertTriangle className="w-3 h-3 text-yellow-400" />
                      Sair do app = perda de energia do pet
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* Pet sidebar */}
        <div className="lg:col-span-1">
          {pet && (
            <Card className="p-6 bg-card border-border/50">
              <PetDisplay pet={pet} size="md" />
              {isRunning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-center"
                >
                  <p className="text-xs text-accent font-medium">Seu pet está ganhando poder!</p>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-2xl mt-2"
                  >
                    ✨
                  </motion.div>
                </motion.div>
              )}
            </Card>
          )}

          {/* Quick tasks */}
          {!isRunning && tasks.length > 0 && (
            <Card className="p-4 bg-card border-border/50 mt-4">
              <h3 className="font-heading text-xs font-semibold tracking-wider text-muted-foreground mb-2">
                TAREFAS RÁPIDAS
              </h3>
              <div className="space-y-1.5">
                {tasks.slice(0, 5).map(task => (
                  <button
                    key={task.id}
                    onClick={() => { setTaskName(task.title); setDuration(task.default_duration || 25); setSecondsLeft((task.default_duration || 25) * 60); }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors text-sm"
                  >
                    {CATEGORY_CONFIG[task.category]?.emoji || '✨'} {task.title}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionResult({ xp, gold, completed, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="text-center py-8 space-y-6"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-6xl"
      >
        {completed ? '🎉' : '😔'}
      </motion.div>
      <div>
        <h2 className="font-heading text-2xl font-bold">
          {completed ? 'Sessão Completa!' : 'Sessão Encerrada'}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {completed ? 'Incrível! Seu pet ficou mais forte!' : 'Não desista, tente novamente!'}
        </p>
      </div>
      <div className="flex justify-center gap-6">
        <div className="text-center">
          <p className="font-heading text-3xl font-bold text-primary">+{xp}</p>
          <p className="text-xs text-muted-foreground">XP</p>
        </div>
        <div className="text-center">
          <p className="font-heading text-3xl font-bold text-yellow-400">+{gold}</p>
          <p className="text-xs text-muted-foreground">Ouro</p>
        </div>
      </div>
      <Button onClick={onReset} className="font-heading tracking-wider">
        <RotateCcw className="w-4 h-4 mr-2" />
        Nova Sessão
      </Button>
    </motion.div>
  );
}