import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_CONFIG } from '@/lib/gameUtils';

const categories = Object.entries(CATEGORY_CONFIG);

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('work');
  const [defaultDuration, setDefaultDuration] = useState(25);
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => appClient.entities.FocusTask.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => appClient.entities.FocusTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTitle('');
      setCategory('work');
      setDefaultDuration(25);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.FocusTask.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const handleCreate = () => {
    if (!title.trim()) return;
    createMutation.mutate({
      title: title.trim(),
      category,
      default_duration: defaultDuration,
      times_completed: 0,
      total_minutes: 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-wider">
            Minhas <span className="text-accent">Tarefas</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Organize suas missões de foco</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="font-heading text-xs tracking-wider">
          <Plus className="w-4 h-4 mr-1" />
          Nova Tarefa
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-4 bg-card border-border/50 space-y-3">
              <Input
                placeholder="Nome da tarefa..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-secondary/50"
              />
              <div className="flex gap-3">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-secondary/50 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.emoji} {config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(defaultDuration)} onValueChange={v => setDefaultDuration(Number(v))}>
                  <SelectTrigger className="bg-secondary/50 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="25">25 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h 30min</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>Criar</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <Card className="p-12 bg-card border-border/50 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-muted-foreground">Nenhuma tarefa ainda. Crie sua primeira missão!</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {tasks.map(task => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="p-4 bg-card border-border/50 flex items-center justify-between group hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_CONFIG[task.category]?.emoji || '✨'}</span>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.default_duration || 25} min
                        </span>
                        <span>{task.times_completed || 0}x completada</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => deleteMutation.mutate(task.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}