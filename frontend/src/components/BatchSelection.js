import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Heart, Scale, X, Trash2 } from 'lucide-react';

const BatchSelection = ({
  selectedItems,
  totalItems,
  onSelectAll,
  onClearSelection,
  onCompareSelected,
  onWishlistSelected,
  onDeleteSelected,
  isVisible,
}) => {
  const selectedCount = selectedItems.length;
  const isAllSelected = selectedCount === totalItems && totalItems > 0;

  if (!isVisible || selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-4">
          {/* Selection count */}
          <div className="flex items-center gap-3 border-r border-gray-200 dark:border-gray-700 pr-4">
            <motion.div
              key={selectedCount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm"
            >
              {selectedCount}
            </motion.div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {selectedCount} selected
              </span>
              <button
                onClick={onSelectAll}
                className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 text-left"
              >
                {isAllSelected ? 'Deselect all' : `Select all ${totalItems}`}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onWishlistSelected}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
            >
              <Heart size={18} />
              <span className="hidden sm:inline text-sm font-medium">Wishlist</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCompareSelected}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-colors"
            >
              <Scale size={18} />
              <span className="hidden sm:inline text-sm font-medium">Compare</span>
            </motion.button>

            {onDeleteSelected && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDeleteSelected}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline text-sm font-medium">Delete</span>
              </motion.button>
            )}
          </div>

          {/* Clear */}
          <button
            onClick={onClearSelection}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ml-2"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Checkbox for individual items
export const BatchCheckbox = ({ checked, onChange, className = '' }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onChange}
      className={`relative w-5 h-5 rounded border-2 transition-colors ${
        checked
          ? 'bg-green-600 border-green-600'
          : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
      } ${className}`}
    >
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Check size={12} className="text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Hook for managing batch selection
export const useBatchSelection = (items) => {
  const [selected, setSelected] = React.useState([]);

  const toggleSelection = React.useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  }, []);

  const selectAll = React.useCallback(() => {
    setSelected((prev) =>
      prev.length === items.length ? [] : items.map((item) => item._id)
    );
  }, [items]);

  const clearSelection = React.useCallback(() => {
    setSelected([]);
  }, []);

  const isSelected = React.useCallback(
    (id) => selected.includes(id),
    [selected]
  );

  const selectedItems = React.useMemo(
    () => items.filter((item) => selected.includes(item._id)),
    [items, selected]
  );

  return {
    selected,
    selectedItems,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection: selected.length > 0,
    isAllSelected: selected.length === items.length && items.length > 0,
  };
};

export default BatchSelection;
