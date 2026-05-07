import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfettiPiece = ({ color, delay }) => {
  const randomX = Math.random() * 400 - 200;
  const randomRotation = Math.random() * 720 - 360;
  
  return (
    <motion.div
      initial={{ 
        y: 0, 
        x: 0, 
        rotate: 0, 
        opacity: 1,
        scale: 1 
      }}
      animate={{ 
        y: [0, -300 - Math.random() * 200],
        x: [0, randomX],
        rotate: randomRotation,
        opacity: [1, 1, 0],
        scale: [1, 1, 0.5]
      }}
      transition={{ 
        duration: 2 + Math.random(),
        delay,
        ease: "easeOut"
      }}
      className="absolute w-3 h-3 rounded-sm"
      style={{ backgroundColor: color }}
    />
  );
};

const ConfettiCelebration = ({ 
  isActive, 
  onComplete, 
  colors = ['#22c55e', '#16a34a', '#15803d', '#eab308', '#f59e0b', '#3b82f6', '#8b5cf6'],
  pieceCount = 50
}) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (isActive) {
      const newPieces = Array.from({ length: pieceCount }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5
      }));
      setPieces(newPieces);
      
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, colors, pieceCount, onComplete]);

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          {pieces.map((piece) => (
            <ConfettiPiece 
              key={piece.id} 
              color={piece.color} 
              delay={piece.delay}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

export const SuccessCheckmark = ({ isActive, onComplete }) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"
          onClick={onComplete}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl"
          >
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              />
            </motion.svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfettiCelebration;
