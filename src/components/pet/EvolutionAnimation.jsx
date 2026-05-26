import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function EvolutionAnimation({ pet, newStage, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  const stageNames = ['', 'Baby', 'Teen', 'Adult', 'Legendary'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 bg-black/30"
    >
      <motion.div
        animate={{ scale: [0.5, 1.1, 1], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 1.2 }}
        className="text-center"
      >
        <div className="text-7xl mb-4">🌟</div>
        <h2 className="text-4xl font-bold text-primary drop-shadow-lg mb-2">
          {pet.name} EVOLUIU!
        </h2>
        <p className="text-xl text-accent drop-shadow-lg">
          Estágio {newStage}: {stageNames[newStage] || 'Desconhecido'}
        </p>
      </motion.div>
    </motion.div>
  );
}
