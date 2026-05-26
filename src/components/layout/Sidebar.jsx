import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Timer, Trophy, ListTodo, Swords, Menu, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Base', icon: Home },
  { path: '/focus', label: 'Foco', icon: Timer },
  { path: '/tasks', label: 'Tarefas', icon: ListTodo },
  { path: '/ranking', label: 'Ranking', icon: Trophy },
  { path: '/battle', label: 'Batalha', icon: Swords },
];

const adminItems = [
  { path: '/admin', label: 'Admin', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card/95 backdrop-blur-xl border-b border-border flex items-center justify-between px-4">
        <span className="font-heading text-lg font-bold tracking-wider text-primary">FOCUSMON</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-card/95 backdrop-blur-xl border-r border-border flex flex-col transition-transform duration-300",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-border">
          <h1 className="font-heading text-xl font-bold tracking-wider text-primary">FOCUSMON</h1>
          <p className="text-xs text-muted-foreground mt-1">Evolua focando</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/15 text-primary shadow-lg shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          {adminItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-yellow-500/15 text-yellow-400"
                    : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="px-4 py-2 rounded-xl bg-secondary/40 mt-2">
            <p className="text-xs text-muted-foreground">Versão MVP</p>
            <p className="text-xs font-heading text-primary/80">v0.1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}