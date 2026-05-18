import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LevelUpAnimation({ level, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
    >
      <motion.div
        animate={{ y: [0, -50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 0.8, repeat: 2 }}
        className="text-6xl font-bold text-primary drop-shadow-lg"
      >
        ✨ LEVEL {level}! ✨
      </motion.div>
    </motion.div>
  );
}
