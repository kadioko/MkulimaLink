import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastIcon = ({ type }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };
  return icons[type] || icons.info;
};

const Toast = ({ toast, onRemove }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -100, scale: 0.8 }}
      className={`
        flex items-center gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm
        ${toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : ''}
        ${toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : ''}
        ${toast.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : ''}
        ${toast.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''}
      `}
    >
      <ToastIcon type={toast.type} />
      <div className="flex-1">
        <p className={`text-sm font-medium ${
          toast.type === 'success' ? 'text-green-800 dark:text-green-200' :
          toast.type === 'error' ? 'text-red-800 dark:text-red-200' :
          toast.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
          'text-blue-800 dark:text-blue-200'
        }`}>
          {toast.title}
        </p>
        {toast.description && (
          <p className={`text-xs mt-1 ${
            toast.type === 'success' ? 'text-green-600 dark:text-green-300' :
            toast.type === 'error' ? 'text-red-600 dark:text-red-300' :
            toast.type === 'warning' ? 'text-yellow-600 dark:text-yellow-300' :
            'text-blue-600 dark:text-blue-300'
          }`}>
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
    </motion.div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((options) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      type: 'info',
      duration: 5000,
      ...options
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((title, description, options = {}) => {
    return addToast({ type: 'success', title, description, ...options });
  }, [addToast]);

  const error = useCallback((title, description, options = {}) => {
    return addToast({ type: 'error', title, description, duration: 0, ...options });
  }, [addToast]);

  const warning = useCallback((title, description, options = {}) => {
    return addToast({ type: 'warning', title, description, ...options });
  }, [addToast]);

  const info = useCallback((title, description, options = {}) => {
    return addToast({ type: 'info', title, description, ...options });
  }, [addToast]);

  const dismiss = useCallback((id) => {
    removeToast(id);
  }, [removeToast]);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    toasts,
    addToast,
    success,
    error,
    warning,
    info,
    dismiss,
    clear
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

// Convenience exports
export const toast = {
  success: (title, description, options) => {
    // This will work if used within ToastProvider
    const { success } = useToast();
    return success(title, description, options);
  },
  error: (title, description, options) => {
    const { error } = useToast();
    return error(title, description, options);
  },
  warning: (title, description, options) => {
    const { warning } = useToast();
    return warning(title, description, options);
  },
  info: (title, description, options) => {
    const { info } = useToast();
    return info(title, description, options);
  }
};

export default ToastProvider;
