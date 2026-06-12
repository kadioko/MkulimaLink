import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Scale, Heart, Check } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';

const EnhancedProductCard = ({ 
  product, 
  currency, 
  index = 0,
  onCompare,
  isCompared = false,
  viewMode = 'grid'
}) => {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const wishlisted = isInWishlist(product._id);

  const handleWishlist = (e) => {
    e.stopPropagation();
    toggleItem(product);
  };

  const handleCompare = (e) => {
    e.stopPropagation();
    onCompare?.(product);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 group"
      >
        <div className="relative w-32 h-32 flex-shrink-0">
          <div className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`} />
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name}
              className={`w-full h-full object-cover rounded-lg transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-3xl">🌾</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-1">
                {product.name}
              </h3>
              <p className="text-gray-500 text-sm">{product.category} • {product.region}</p>
              {product.seller && (
                <p className="mt-1 text-sm text-gray-600">{product.seller.name}</p>
              )}
            </div>
            <div className="flex gap-2">
              <motion.button
                onClick={handleCompare}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full transition-colors ${
                  isCompared 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={isCompared ? 'Remove from comparison' : 'Add to comparison'}
              >
                <Scale size={18} />
              </motion.button>
              <motion.button
                onClick={handleWishlist}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full transition-colors ${
                  wishlisted 
                    ? 'bg-red-100 text-red-500' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
              </motion.button>
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-xl font-bold text-green-600">
                {currency} {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
              </p>
              <p className="text-sm text-gray-400">per {product.unit}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {product.region}
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded-full">
                {product.quantity} {product.unit} available
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 group overflow-hidden cursor-pointer"
    >
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`} />
          {product.image ? (
            <motion.img 
              src={product.image} 
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
              onLoad={() => setImageLoaded(true)}
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.4 }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
              <motion.span 
                className="text-5xl"
                animate={{ scale: isHovered ? 1.2 : 1, rotate: isHovered ? 10 : 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                🌾
              </motion.span>
            </div>
          )}
        </div>
        
        {/* Overlay Actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
            />
          )}
        </AnimatePresence>
        
        <motion.button
          onClick={handleWishlist}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg transition-all ${
            wishlisted 
              ? 'bg-red-500 text-white' 
              : 'bg-white text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
        </motion.button>
        
        <motion.button
          onClick={handleCompare}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className={`absolute top-3 left-3 p-2.5 rounded-full shadow-lg transition-all ${
            isCompared 
              ? 'bg-green-500 text-white' 
              : 'bg-white text-gray-600 hover:text-green-600'
          }`}
          title={isCompared ? 'Remove from comparison' : 'Compare'}
        >
          {isCompared ? <Check size={20} /> : <Scale size={20} />}
        </motion.button>
        
        {product.quality === 'premium' && (
          <motion.div 
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            className="absolute bottom-3 left-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md"
          >
            Premium Quality
          </motion.div>
        )}
      </div>
      
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
          {product.organic && (
            <span className="flex-shrink-0 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
              Organic
            </span>
          )}
        </div>
        
        <p className="text-gray-500 text-sm mb-3 flex items-center gap-1">
          <MapPin size={14} />
          {product.region}, {product.country}
        </p>

        {product.category && (
          <p className="text-sm text-gray-600 mb-3">{product.category}</p>
        )}
        
        <div className="flex items-end justify-between">
          <div>
            <motion.p 
              className="text-2xl font-bold text-green-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {currency} {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
            </motion.p>
            <p className="text-sm text-gray-400">per {product.unit}</p>
          </div>
          <motion.span 
            className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full"
            whileHover={{ scale: 1.05 }}
          >
            {product.quantity} {product.unit}
          </motion.span>
        </div>
        
        {product.seller && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {product.seller.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <span className="text-sm text-gray-600">{product.seller.name}</span>
            {product.seller.verified && (
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">Verified</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedProductCard;
