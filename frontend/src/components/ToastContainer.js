import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

const Toast = ({ toast, onRemove }) => {
  const Icon = toastIcons[toast.type];
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[300px] max-w-[400px] ${toastStyles[toast.type]}`}
    >
      <Icon size={20} className={iconColors[toast.type]} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <motion.button
        onClick={() => onRemove(toast.id)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-1 hover:bg-black/5 rounded-full transition-colors"
      >
        <X size={16} />
      </motion.button>
    </motion.div>
  );
};

const ToastContainer = ({ toasts, removeToast, position = 'bottom-right' }) => {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={`fixed z-50 flex flex-col gap-2 ${positionStyles[position]}`}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
