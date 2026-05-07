import React from 'react';
import { motion } from 'framer-motion';

export const ShimmerSkeleton = ({ className = '', width, height }) => {
  return (
    <motion.div
      className={`relative overflow-hidden bg-gray-200 rounded ${className}`}
      style={{ width, height }}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
};

export const ProductCardSkeleton = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4">
        <ShimmerSkeleton width={128} height={128} className="rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <ShimmerSkeleton width="60%" height={24} className="rounded" />
          <ShimmerSkeleton width="40%" height={16} className="rounded" />
          <div className="flex justify-between pt-2">
            <ShimmerSkeleton width={100} height={28} className="rounded" />
            <ShimmerSkeleton width={120} height={20} className="rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <ShimmerSkeleton width="100%" height={192} />
      <div className="p-5 space-y-3">
        <ShimmerSkeleton width="75%" height={24} className="rounded" />
        <ShimmerSkeleton width="50%" height={16} className="rounded" />
        <div className="flex justify-between pt-2">
          <ShimmerSkeleton width={100} height={32} className="rounded" />
          <ShimmerSkeleton width={80} height={24} className="rounded" />
        </div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton = ({ count = 6, viewMode = 'grid' }) => {
  return (
    <div className={viewMode === 'grid' 
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      : "space-y-4"
    }>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <ProductCardSkeleton viewMode={viewMode} />
        </motion.div>
      ))}
    </div>
  );
};

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 px-4"
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6"
      >
        {Icon ? (
          <Icon size={40} className="text-gray-400" />
        ) : (
          <span className="text-4xl">🔍</span>
        )}
      </motion.div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">{description}</p>
      
      {action && (
        <motion.button
          onClick={action}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
};

export const ErrorState = ({ 
  title = 'Something went wrong',
  description = 'Unable to load data. Please try again.',
  onRetry 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 px-4"
    >
      <motion.div
        animate={{ shake: [0, -5, 5, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
        className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6"
      >
        <span className="text-4xl">⚠️</span>
      </motion.div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">{description}</p>
      
      {onRetry && (
        <motion.button
          onClick={onRetry}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
        >
          Try Again
        </motion.button>
      )}
    </motion.div>
  );
};

export default ShimmerSkeleton;
