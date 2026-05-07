import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Search, TrendingUp } from 'lucide-react';
import { useRecentSearches } from '../hooks/useFuzzySearch';
import { formatDistanceToNow } from 'date-fns';

const RecentSearches = ({ onSelect, className = '' }) => {
  const { recentSearches, removeSearch, clearSearches } = useRecentSearches();

  if (recentSearches.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Clock size={16} />
          <span className="text-sm font-medium">Recent Searches</span>
        </div>
        <button
          onClick={clearSearches}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto">
        <AnimatePresence initial={false}>
          {recentSearches.map((item, index) => (
            <motion.button
              key={item.query}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(item.query)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Search size={16} className="text-gray-400 group-hover:text-green-500 transition-colors" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{item.query}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSearch(item.query);
                  }}
                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Trending searches component
export const TrendingSearches = ({ onSelect, className = '' }) => {
  // Mock trending searches - in production, fetch from API
  const trending = [
    'Organic Maize',
    'Fresh Tomatoes',
    'Dairy Cows',
    'Fertilizer NPK',
    'Sweet Potatoes',
  ];

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-3">
        <TrendingUp size={16} className="text-green-500" />
        <span className="text-sm font-medium">Trending Now</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {trending.map((term, index) => (
          <motion.button
            key={term}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(term)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 rounded-full text-sm font-medium transition-colors"
          >
            {term}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Combined search suggestions
export const SearchSuggestions = ({
  query,
  onSelect,
  onClose,
  className = '',
}) => {
  const { recentSearches } = useRecentSearches();
  
  // Filter recent searches based on query
  const filtered = query
    ? recentSearches.filter(item =>
        item.query.toLowerCase().includes(query.toLowerCase())
      )
    : recentSearches.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {filtered.length > 0 && (
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Recent
          </div>
          {filtered.map((item) => (
            <button
              key={item.query}
              onClick={() => {
                onSelect(item.query);
                onClose?.();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Clock size={16} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{item.query}</span>
            </button>
          ))}
        </div>
      )}
      
      <div className="border-t border-gray-100 dark:border-gray-700 p-3">
        <TrendingSearches onSelect={(term) => {
          onSelect(term);
          onClose?.();
        }} />
      </div>
    </motion.div>
  );
};

export default RecentSearches;
