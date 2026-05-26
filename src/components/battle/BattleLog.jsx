import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BattleLog({ lines }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="bg-secondary/30 rounded-xl p-3 h-28 overflow-y-auto space-y-1 font-mono text-sm">
      <AnimatePresence initial={false}>
        {lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="leading-snug"
          >
            <span className="text-primary mr-1.5">›</span>{line}
          </motion.p>
        ))}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}