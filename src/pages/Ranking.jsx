import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, LogIn, ArrowLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateGroupModal from '@/components/ranking/CreateGroupModal';
import JoinGroupModal from '@/components/ranking/JoinGroupModal';
import GroupInviteCode from '@/components/ranking/GroupInviteCode';
import GroupLeaderboard from '@/components/ranking/GroupLeaderboard';
import { useAuth } from '@/lib/AuthContext';

export default function Ranking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const { data: myPets } = useQuery({
    queryKey: ['my-pet'],
    queryFn: () => base44.entities.FocusPet.list(),
    initialData: [],
  });
  const myPet = myPets[0];

  const { data: allGroups, isLoading } = useQuery({
    queryKey: ['all-groups'],
    queryFn: () => base44.entities.FocusGroup.list('-created_date', 100),
    initialData: [],
  });

  const { data: allPets } = useQuery({
    queryKey: ['all-pets-for-groups'],
    queryFn: () => base44.entities.FocusPet.list('-level', 200),
    initialData: [],
  });

  // Groups the current user's pet is a member of (or owner)
  const myGroups = allGroups.filter(g =>
    g.owner_email === user?.email ||
    (g.member_ids || []).includes(myPet?.id)
  );

  const selectedGroup = allGroups.find(g => g.id === selectedGroupId);

  // Pets that are members of the selected group
  const groupMembers = selectedGroup
    ? allPets.filter(p =>
        (selectedGroup.member_ids || []).includes(p.id) ||
        (p.created_by === selectedGroup.owner_email && selectedGroup.owner_email === user?.email ? true : selectedGroup.member_ids?.includes(p.id))
      )
    : [];

  const handleCreateGroup = async (data) => {
    const group = await base44.entities.FocusGroup.create({
      ...data,
      owner_email: user?.email,
      member_ids: myPet ? [myPet.id] : [],
    });
    queryClient.invalidateQueries({ queryKey: ['all-groups'] });
    setSelectedGroupId(group.id);
  };

  const handleJoinGroup = async (code) => {
    const group = allGroups.find(g => g.invite_code === code);
    if (!group) return { error: 'Código inválido. Verifique e tente novamente.' };
    if (!myPet) return { error: 'Você precisa ter um pet para entrar em grupos.' };

    const currentMembers = group.member_ids || [];
    if (currentMembers.includes(myPet.id)) return { error: 'Você já é membro deste grupo!' };

    await base44.entities.FocusGroup.update(group.id, {
      member_ids: [...currentMembers, myPet.id],
    });
    queryClient.invalidateQueries({ queryKey: ['all-groups'] });
    setSelectedGroupId(group.id);
    return {};
  };

  const handleLeaveGroup = async (group) => {
    if (group.owner_email === user?.email) {
      // Owner deletes the group
      await base44.entities.FocusGroup.delete(group.id);
    } else {
      // Member leaves
      await base44.entities.FocusGroup.update(group.id, {
        member_ids: (group.member_ids || []).filter(id => id !== myPet?.id),
      });
    }
    queryClient.invalidateQueries({ queryKey: ['all-groups'] });
    setSelectedGroupId(null);
  };

  const isOwner = selectedGroup?.owner_email === user?.email;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-wider">
          <span className="text-yellow-400">Grupos</span> & Ranking
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Compita com seus amigos no ranking do grupo</p>
      </div>

      <AnimatePresence mode="wait">
        {/* GROUP DETAIL VIEW */}
        {selectedGroup ? (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedGroupId(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <h2 className="font-heading text-xl font-bold">{selectedGroup.name}</h2>
                {selectedGroup.description && <p className="text-xs text-muted-foreground">{selectedGroup.description}</p>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLeaveGroup(selectedGroup)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {isOwner ? 'Deletar' : 'Sair'}
              </Button>
            </div>

            {/* Invite code */}
            <Card className="p-4 bg-card border-border/50 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Código de convite</p>
                <GroupInviteCode code={selectedGroup.invite_code} />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Membros</p>
                <p className="font-heading text-2xl font-bold text-primary">{groupMembers.length}</p>
              </div>
            </Card>

            {/* Leaderboard */}
            {groupMembers.length === 0 ? (
              <Card className="p-10 bg-card border-border/50 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Nenhum membro ainda. Compartilhe o código!</p>
              </Card>
            ) : (
              <GroupLeaderboard members={groupMembers} myPetId={myPet?.id} />
            )}
          </motion.div>
        ) : (
          /* GROUP LIST VIEW */
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={() => setShowCreate(true)} className="font-heading text-xs tracking-wider flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-1" /> Criar Grupo
              </Button>
              <Button onClick={() => setShowJoin(true)} variant="outline" className="font-heading text-xs tracking-wider flex-1 sm:flex-none border-accent/50 text-accent hover:bg-accent/10">
                <LogIn className="w-4 h-4 mr-1" /> Entrar com Código
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : myGroups.length === 0 ? (
              <Card className="p-12 bg-card border-border/50 text-center space-y-3">
                <Users className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="font-medium">Você não está em nenhum grupo</p>
                <p className="text-sm text-muted-foreground">Crie um grupo e convide seus amigos, ou entre em um grupo com um código!</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {myGroups.map(group => {
                  const memberCount = (group.member_ids || []).length;
                  return (
                    <motion.div key={group.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card
                        className="p-4 bg-card border-border/50 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-colors"
                        onClick={() => setSelectedGroupId(group.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{group.name}</p>
                              {group.owner_email === user?.email && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">dono</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{memberCount} membro{memberCount !== 1 ? 's' : ''} · Código: {group.invite_code}</p>
                          </div>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreateGroup} />
      <JoinGroupModal open={showJoin} onClose={() => setShowJoin(false)} onJoined={handleJoinGroup} />
    </div>
  );
}