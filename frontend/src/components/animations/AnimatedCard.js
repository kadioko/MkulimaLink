import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ 
  children, 
  className = '', 
  hoverScale = 1.02,
  hoverY = -4,
  delay = 0,
  onClick,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        scale: hoverScale, 
        y: hoverY,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-xl shadow-md overflow-hidden cursor-pointer ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedFeatureCard = ({ icon: Icon, title, description, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group"
    >
      <motion.div 
        className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:from-green-200 group-hover:to-emerald-200 transition-colors"
        whileHover={{ rotate: 5, scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <Icon className="text-green-600" size={28} />
      </motion.div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};

export const AnimatedProductCard = ({ product, currency, onWishlist, isWishlisted, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 group overflow-hidden"
    >
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl overflow-hidden">
          {product.image ? (
            <motion.img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-4xl">🌾</span>
            </div>
          )}
        </div>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onWishlist?.();
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg transition-colors ${
            isWishlisted 
              ? 'bg-red-500 text-white' 
              : 'bg-white text-gray-400 hover:text-red-500'
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill={isWishlisted ? "currentColor" : "none"}
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </motion.button>
        {product.quality === 'premium' && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            Premium
          </div>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-gray-500 text-sm mb-3">{product.category} • {product.region}</p>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {currency} {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
            </p>
            <p className="text-sm text-gray-400">per {product.unit}</p>
          </div>
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {product.quantity} {product.unit} available
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedCard;
