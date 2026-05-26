import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ELEMENT_CONFIG } from '@/lib/gameUtils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const elements = Object.entries(ELEMENT_CONFIG);

export default function CreatePetModal({ open, onCreatePet }) {
  const [name, setName] = useState('');
  const [element, setElement] = useState('fire');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreatePet({ name: name.trim(), element });
    setLoading(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-card border-border" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-center tracking-wider">
            Escolha seu <span className="text-primary">FocusMon</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Nome do Pet</label>
            <Input
              placeholder="Ex: Sparky, Luna, Blaze..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-secondary/50 border-border text-lg"
              maxLength={20}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-3 block">Elemento</label>
            <div className="grid grid-cols-5 gap-2">
              {elements.map(([key, config]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setElement(key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                    element === key
                      ? `${config.border} ${config.bg} shadow-lg ${config.glow}`
                      : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
                  )}
                >
                  <span className="text-2xl">{config.emoji}</span>
                  <span className={cn("text-[10px] font-medium", element === key ? config.color : "text-muted-foreground")}>
                    {config.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="w-full h-12 font-heading text-sm tracking-wider bg-primary hover:bg-primary/90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? 'Criando...' : 'Criar meu FocusMon'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}