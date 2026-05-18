import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Copy, Check } from 'lucide-react';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CreateGroupModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreated({ name: name.trim(), description: description.trim(), invite_code: generateCode(), member_ids: [] });
    setName('');
    setDescription('');
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Criar Grupo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            placeholder="Nome do grupo..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-secondary/50"
          />
          <Input
            placeholder="Descrição (opcional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="bg-secondary/50"
          />
          <Button onClick={handleCreate} disabled={!name.trim() || loading} className="w-full font-heading tracking-wider">
            {loading ? 'Criando...' : 'Criar Grupo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}