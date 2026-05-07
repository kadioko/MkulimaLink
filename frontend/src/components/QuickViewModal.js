import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Scale, Heart, Share2, Check, Truck, Shield, Star } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import OptimizedImage from './OptimizedImage';

const QuickViewModal = ({ product, isOpen, onClose, currency, onCompare }) => {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const wishlisted = isInWishlist(product?._id);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Section */}
                <div className="relative bg-gray-100 dark:bg-gray-800 aspect-square md:aspect-auto">
                  <OptimizedImage
                    src={product.image}
                    alt={product.name}
                    containerClassName="w-full h-full"
                    className="rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
                    priority
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.quality === 'premium' && (
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                        Premium
                      </span>
                    )}
                    {product.organic && (
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                        Organic
                      </span>
                    )}
                  </div>

                  {/* Close button (mobile) */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md md:hidden"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content Section */}
                <div className="p-6 md:p-8 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{product.category}</span>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        {product.name}
                      </h2>
                    </div>
                    <button
                      onClick={onClose}
                      className="hidden md:flex p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          className={star <= (product.rating || 4)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                          }
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({product.reviews || 0} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl md:text-4xl font-bold text-green-600">
                        {currency} {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">per {product.unit}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {product.quantity} {product.unit} available
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {product.description || `High-quality ${product.category?.toLowerCase()} sourced directly from ${product.region}. Fresh, certified, and ready for immediate delivery.`}
                  </p>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-6">
                    <MapPin size={18} />
                    <span>{product.region}, {product.country}</span>
                  </div>

                  {/* Seller Info */}
                  {product.seller && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {product.seller.name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{product.seller.name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          {product.seller.verified && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <Check size={14} />
                              Verified
                            </span>
                          )}
                          <span className="text-gray-500 dark:text-gray-400">• {product.seller.rating || '4.8'} rating</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trust badges */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Truck size={16} className="text-green-500" />
                      Fast Delivery
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Shield size={16} className="text-green-500" />
                      Secure Payment
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto">
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
                      Contact Seller
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleItem(product)}
                      className={`p-3 rounded-xl border-2 transition-colors ${
                        wishlisted
                          ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-500 hover:text-red-500'
                      }`}
                    >
                      <Heart size={24} fill={wishlisted ? 'currentColor' : 'none'} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onCompare?.(product)}
                      className="p-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors"
                    >
                      <Scale size={24} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors"
                    >
                      <Share2 size={24} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;
