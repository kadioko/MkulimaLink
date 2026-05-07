import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PageLoader = ({ isLoading }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-white z-50 flex items-center justify-center"
        >
          <div className="flex flex-col items-center">
            {/* Logo Animation */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl mb-6"
            >
              <span className="text-white font-extrabold text-3xl">M</span>
            </motion.div>
            
            {/* Loading Bar */}
            <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                animate={{
                  x: [-192, 192],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-24 h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
              />
            </div>
            
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-gray-500 mt-4 text-sm font-medium"
            >
              Loading MkulimaLink...
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader;
