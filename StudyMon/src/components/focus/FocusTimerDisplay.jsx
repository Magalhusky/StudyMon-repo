import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function FocusTimerDisplay({ secondsLeft, totalSeconds, isRunning, element }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow */}
      {isRunning && (
        <motion.div
          className="absolute w-72 h-72 rounded-full bg-primary/10 blur-2xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* SVG Circle */}
      <svg width="280" height="280" className="transform -rotate-90">
        <circle
          cx="140" cy="140" r="120"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="6"
        />
        <motion.circle
          cx="140" cy="140" r="120"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5 }}
        />
      </svg>

      {/* Timer text */}
      <div className="absolute flex flex-col items-center">
        <span className="font-heading text-5xl md:text-6xl font-bold tracking-wider">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        {isRunning && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs text-primary font-medium mt-2 tracking-widest"
          >
            FOCANDO...
          </motion.span>
        )}
      </div>
    </div>
  );
}