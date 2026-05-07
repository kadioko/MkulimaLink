import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

const ThemeToggle = ({ variant = 'icon' }) => {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useThemeStore();
  
  const isDark = resolvedTheme === 'dark';
  
  if (variant === 'segmented') {
    const options = [
      { value: 'light', icon: Sun, label: 'Light' },
      { value: 'dark', icon: Moon, label: 'Dark' },
      { value: 'system', icon: Monitor, label: 'Auto' },
    ];
    
    return (
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;
          
          return (
            <motion.button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTheme"
                  className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icon size={16} />
                <span className="hidden sm:inline">{option.label}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }
  
  // Icon variant
  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun size={20} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon size={20} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default ThemeToggle;
