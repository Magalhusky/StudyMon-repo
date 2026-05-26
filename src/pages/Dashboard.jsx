import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import PetDisplay from '@/components/pet/PetDisplay';
import XPBar from '@/components/pet/XPBar';
import StatsGrid from '@/components/pet/StatsGrid';
import CreatePetModal from '@/components/onboarding/CreatePetModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Timer, ListTodo, Trophy, Swords, TrendingUp, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEvolutionStage, getXPForLevel, getPower } from '@/lib/gameUtils';

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: pets, isLoading } = useQuery({
    queryKey: ['my-pet'],
    queryFn: () => base44.entities.FocusPet.list(),
    initialData: [],
  });

  const { data: sessions } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: () => base44.entities.FocusSession.list('-created_date', 5),
    initialData: [],
  });

  const pet = pets.length > 0 ? pets[0] : null;
  const needsPet = !isLoading && !pet;

  const handleCreatePet = async (data) => {
    await base44.entities.FocusPet.create({
      ...data,
      level: 1,
      xp: 0,
      xp_to_next_level: 100,
      energy: 100,
      evolution_stage: 1,
      total_focus_minutes: 0,
      gold: 0,
      streak_days: 0,
      battles_won: 0,
      power: 10,
      skin: 'default',
    });
    queryClient.invalidateQueries({ queryKey: ['my-pet'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CreatePetModal open={needsPet} onCreatePet={handleCreatePet} />

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-wider">
          Base do <span className="text-primary">Treinador</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Seu quartel-general de produtividade</p>
      </div>

      {pet && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pet Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <Card className="p-6 bg-card border-border/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
              <PetDisplay pet={pet} size="lg" />
              <div className="mt-4">
                <XPBar
                  currentXP={pet.xp || 0}
                  xpToNext={pet.xp_to_next_level || 100}
                  level={pet.level || 1}
                />
              </div>
            </Card>
          </motion.div>

          {/* Stats & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <StatsGrid pet={pet} />

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link to="/focus">
                <QuickAction icon={Timer} label="Iniciar Foco" color="text-primary" />
              </Link>
              <Link to="/tasks">
                <QuickAction icon={ListTodo} label="Tarefas" color="text-accent" />
              </Link>
              <Link to="/ranking">
                <QuickAction icon={Trophy} label="Ranking" color="text-yellow-400" />
              </Link>
              <Link to="/battle">
                <QuickAction icon={Swords} label="Batalhar" color="text-purple-400" />
              </Link>
            </div>

            {/* Recent sessions */}
            <Card className="p-4 bg-card border-border/50">
              <h3 className="font-heading text-sm font-semibold tracking-wider text-muted-foreground mb-3">
                SESSÕES RECENTES
              </h3>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma sessão ainda. Comece a focar!
                </p>
              ) : (
                <div className="space-y-2">
                  {sessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium">{session.task_name}</p>
                        <p className="text-xs text-muted-foreground">{session.actual_minutes || 0} min</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-heading text-primary">+{session.xp_earned || 0} XP</p>
                        {session.completed && <span className="text-xs text-accent">✓ Completa</span>}
                        {session.failed && <span className="text-xs text-destructive">✗ Falhou</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon: Icon, label, color }) {
  return (
    <Card className="p-4 bg-card border-border/50 hover:bg-secondary/40 transition-all cursor-pointer group">
      <Icon className={`w-6 h-6 ${color} mb-2 group-hover:scale-110 transition-transform`} />
      <p className="text-xs font-medium">{label}</p>
    </Card>
  );
}