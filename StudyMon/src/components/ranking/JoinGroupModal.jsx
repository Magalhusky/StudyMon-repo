import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';

export default function JoinGroupModal({ open, onClose, onJoined }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    const result = await onJoined(code.trim().toUpperCase());
    if (result?.error) setError(result.error);
    else { setCode(''); onClose(); }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading tracking-wider flex items-center gap-2">
            <LogIn className="w-5 h-5 text-accent" /> Entrar em um Grupo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            placeholder="Código do grupo (ex: ABC123)"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            className="bg-secondary/50 tracking-widest text-center font-heading"
            maxLength={6}
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button onClick={handleJoin} disabled={!code.trim() || loading} className="w-full font-heading tracking-wider bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? 'Entrando...' : 'Entrar no Grupo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}