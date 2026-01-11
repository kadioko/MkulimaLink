import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

const DarkModeToggle = ({ className = '' }) => {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
};

export default DarkModeToggle;
