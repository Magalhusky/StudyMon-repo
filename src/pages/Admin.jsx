import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import {
  Settings, Save, RefreshCcw, Zap, Shield, Flame,
  Clock, Coins, Trophy, TrendingUp, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { ELEMENT_CONFIG, getPetVisual, getEvolutionStage, getXPForLevel, getPower } from '@/lib/gameUtils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Admin() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [expandedPet, setExpandedPet] = useState(null);
  const [edits, setEdits] = useState({});

  const { data: allPets, isLoading } = useQuery({
    queryKey: ['admin-all-pets'],
    queryFn: () => appClient.entities.FocusPet.list('-level', 100),
    initialData: [],
  });

  const { data: allSessions } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () => appClient.entities.FocusSession.list('-created_date', 20),
    initialData: [],
  });

  const handleEdit = (petId, field, value) => {
    setEdits(prev => ({
      ...prev,
      [petId]: { ...prev[petId], [field]: value },
    }));
  };

  const getEditValue = (pet, field) => {
    return edits[pet.id]?.[field] !== undefined ? edits[pet.id][field] : (pet[field] ?? 0);
  };

  const handleSave = async (pet) => {
    const changes = edits[pet.id];
    if (!changes || Object.keys(changes).length === 0) {
      toast.info('Nenhuma alteração para salvar.');
      return;
    }
    setSaving(true);
    const numericFields = ['level', 'xp', 'xp_to_next_level', 'energy', 'evolution_stage', 'total_focus_minutes', 'gold', 'streak_days', 'battles_won', 'power'];
    const payload = {};
    for (const [k, v] of Object.entries(changes)) {
      payload[k] = numericFields.includes(k) ? Number(v) : v;
    }
    // Recalculate derived fields if level changed
    if (payload.level !== undefined) {
      payload.xp_to_next_level = getXPForLevel(payload.level);
      payload.evolution_stage = getEvolutionStage(payload.level);
      payload.power = getPower(payload.level, payload.total_focus_minutes ?? pet.total_focus_minutes ?? 0, payload.battles_won ?? pet.battles_won ?? 0);
    }
    await appClient.entities.FocusPet.update(pet.id, payload);
    setEdits(prev => { const next = { ...prev }; delete next[pet.id]; return next; });
    queryClient.invalidateQueries({ queryKey: ['admin-all-pets'] });
    queryClient.invalidateQueries({ queryKey: ['my-pet'] });
    toast.success(`${pet.name} atualizado!`);
    setSaving(false);
  };

  const handleReset = (petId) => {
    setEdits(prev => { const next = { ...prev }; delete next[petId]; return next; });
  };

  const handleSetLevel = (pet, level) => {
    const l = Math.max(1, Math.min(50, Number(level)));
    handleEdit(pet.id, 'level', l);
    handleEdit(pet.id, 'xp', 0);
    handleEdit(pet.id, 'xp_to_next_level', getXPForLevel(l));
    handleEdit(pet.id, 'evolution_stage', getEvolutionStage(l));
  };

  const statFields = [
    { key: 'level', label: 'Level', icon: Zap, color: 'text-primary', min: 1, max: 50 },
    { key: 'xp', label: 'XP Atual', icon: TrendingUp, color: 'text-accent', min: 0, max: 10000 },
    { key: 'energy', label: 'Energia', icon: Flame, color: 'text-orange-400', min: 0, max: 100 },
    { key: 'gold', label: 'Ouro', icon: Coins, color: 'text-yellow-400', min: 0, max: 999999 },
    { key: 'streak_days', label: 'Streak (dias)', icon: Flame, color: 'text-orange-500', min: 0, max: 365 },
    { key: 'total_focus_minutes', label: 'Minutos Focados', icon: Clock, color: 'text-blue-400', min: 0, max: 99999 },
    { key: 'battles_won', label: 'Batalhas Vencidas', icon: Trophy, color: 'text-purple-400', min: 0, max: 9999 },
    { key: 'power', label: 'Poder', icon: Shield, color: 'text-cyan-400', min: 1, max: 9999 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
          <Settings className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-wider">
            Painel <span className="text-yellow-400">Admin</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Edite os atributos dos pets para testes</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>Modo de teste — as alterações afetam diretamente o banco de dados.</span>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total de Pets" value={allPets.length} icon="🐾" />
        <SummaryCard label="Sessões Registradas" value={allSessions.length} icon="⏱️" />
        <SummaryCard label="Level Médio" value={allPets.length ? Math.round(allPets.reduce((a, p) => a + (p.level || 1), 0) / allPets.length) : 0} icon="⚡" />
        <SummaryCard label="Poder Médio" value={allPets.length ? Math.round(allPets.reduce((a, p) => a + (p.power || 10), 0) / allPets.length) : 0} icon="🛡️" />
      </div>

      {/* Pets list */}
      <div className="space-y-3">
        <h2 className="font-heading text-sm font-semibold tracking-wider text-muted-foreground">PETS NO SISTEMA</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : allPets.length === 0 ? (
          <Card className="p-10 text-center bg-card border-border/50">
            <p className="text-muted-foreground">Nenhum pet criado ainda.</p>
          </Card>
        ) : (
          allPets.map(pet => {
            const element = ELEMENT_CONFIG[pet.element] || ELEMENT_CONFIG.fire;
            const visual = getPetVisual(pet.element, pet.evolution_stage || 1);
            const isExpanded = expandedPet === pet.id;
            const hasChanges = edits[pet.id] && Object.keys(edits[pet.id]).length > 0;

            return (
              <motion.div key={pet.id} layout>
                <Card className={cn(
                  "bg-card border overflow-hidden",
                  hasChanges ? 'border-yellow-500/40' : 'border-border/50'
                )}>
                  {/* Pet header row */}
                  <button
                    className="w-full p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors text-left"
                    onClick={() => setExpandedPet(isExpanded ? null : pet.id)}
                  >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-2xl border", element.bg, element.border)}>
                      {visual}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{pet.name}</p>
                        {hasChanges && <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">modificado</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pet.created_by?.split('@')[0]} · Lv.{pet.level || 1} · {element.emoji} {element.label} · Poder: {pet.power || 10}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {/* Expanded editor */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border/50 p-4 space-y-4"
                    >
                      {/* Level quick set */}
                      <div>
                        <label className="text-xs text-muted-foreground font-medium mb-2 block">
                          Level (1–50) — recalcula evolução, poder e XP para próximo nível
                        </label>
                        <div className="flex items-center gap-3">
                          <Slider
                            min={1} max={50} step={1}
                            value={[getEditValue(pet, 'level')]}
                            onValueChange={([v]) => handleSetLevel(pet, v)}
                            className="flex-1"
                          />
                          <Input
                            type="number" min={1} max={50}
                            value={getEditValue(pet, 'level')}
                            onChange={e => handleSetLevel(pet, e.target.value)}
                            className="w-20 bg-secondary/50 text-center"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {statFields.filter(f => f.key !== 'level').map(field => (
                          <StatEditField
                            key={field.key}
                            field={field}
                            value={getEditValue(pet, field.key)}
                            onChange={v => handleEdit(pet.id, field.key, v)}
                          />
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(pet)}
                          disabled={saving || !hasChanges}
                          className="font-heading text-xs tracking-wider"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReset(pet.id)}
                          disabled={!hasChanges}
                        >
                          <RefreshCcw className="w-3 h-3 mr-1" />
                          Resetar
                        </Button>
                        {/* Quick presets */}
                        <div className="ml-auto flex gap-1.5">
                          {[
                            { label: 'Baby', level: 1 },
                            { label: 'Teen', level: 5 },
                            { label: 'Adult', level: 15 },
                            { label: 'Legend', level: 30 },
                          ].map(preset => (
                            <button
                              key={preset.label}
                              onClick={() => handleSetLevel(pet, preset.level)}
                              className="text-xs px-2 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Recent sessions */}
      <div className="space-y-3">
        <h2 className="font-heading text-sm font-semibold tracking-wider text-muted-foreground">SESSÕES RECENTES</h2>
        <Card className="bg-card border-border/50 overflow-hidden">
          {allSessions.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground text-sm">Nenhuma sessão registrada.</p>
          ) : (
            <div className="divide-y divide-border/30">
              {allSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{s.task_name}</p>
                    <p className="text-xs text-muted-foreground">{s.created_by?.split('@')[0]} · {s.actual_minutes || 0} min</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-heading">+{s.xp_earned || 0} XP</p>
                    <p className={cn("text-xs", s.completed ? 'text-accent' : 'text-destructive')}>
                      {s.completed ? '✓ Completa' : '✗ Falhou'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <Card className="p-4 bg-card border-border/50">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="font-heading text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

function StatEditField({ field, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <field.icon className={cn('w-3.5 h-3.5', field.color)} />
        {field.label}
      </label>
      <div className="flex items-center gap-2">
        <Slider
          min={field.min} max={field.max} step={1}
          value={[Math.min(Number(value), field.max)]}
          onValueChange={([v]) => onChange(v)}
          className="flex-1"
        />
        <Input
          type="number" min={field.min} max={field.max}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-20 bg-secondary/50 text-center text-sm h-8"
        />
      </div>
    </div>
  );
}