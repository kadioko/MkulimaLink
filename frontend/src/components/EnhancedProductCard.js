import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  Heart,
  MapPin,
  MessageSquare,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';

const categoryFallbackImages = {
  Vegetables: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&h=500&fit=crop',
  Fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=700&h=500&fit=crop',
  Grains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=700&h=500&fit=crop',
  Legumes: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=700&h=500&fit=crop',
};

const EnhancedProductCard = ({
  product,
  currency,
  index = 0,
  onCompare,
  isCompared = false,
  viewMode = 'grid',
}) => {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const wishlisted = isInWishlist(product._id);
  const imageUrl = product.image || product.images?.[0]?.url || categoryFallbackImages[product.category];
  const fallbackImageUrl = categoryFallbackImages[product.category] || categoryFallbackImages.Vegetables;
  const displayImageUrl = imageFailed ? fallbackImageUrl : imageUrl;
  const region = product.region || product.location?.region || 'Regional supply';
  const sellerName = product.seller?.name || product.sellerName || 'Verified seller';
  const price = typeof product.price === 'number' ? product.price.toLocaleString() : product.price;
  const demandSignal = product.demandSignal || (product.organic ? 'Strong demand' : 'Market demand');
  const responseTime = product.responseTime || `${(1.4 + (index % 5) * 0.7).toFixed(1)} hrs`;
  const demandTone = index % 4 === 0 ? 'text-red-600' : index % 3 === 0 ? 'text-amber-600' : 'text-emerald-700';

  const handleWishlist = (e) => {
    e.stopPropagation();
    toggleItem(product);
  };

  const handleCompare = (e) => {
    e.stopPropagation();
    onCompare?.(product);
  };

  const ImageBlock = ({ compact = false }) => (
    <div className={`relative overflow-hidden bg-slate-100 ${compact ? 'h-32 w-full sm:w-32' : 'h-44 w-full'}`}>
      <div className={`absolute inset-0 flex flex-col items-center justify-center bg-emerald-50 text-emerald-900 transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}>
        <span className="text-2xl font-black">ML</span>
        <span className="mt-1 text-xs font-black uppercase tracking-wide text-emerald-700">Produce photo</span>
      </div>
      {displayImageUrl ? (
        <motion.img
          src={displayImageUrl}
          alt={product.name}
          className={`h-full w-full object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageFailed(true);
            setImageLoaded(false);
          }}
          animate={{ scale: isHovered ? 1.06 : 1 }}
          transition={{ duration: 0.35 }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-2xl font-black text-emerald-800">
          ML
        </div>
      )}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: index * 0.04 }}
        whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
        className="group grid gap-4 border border-slate-200 bg-white p-4 sm:grid-cols-[128px_1fr_auto]"
      >
        <ImageBlock compact />

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-lg font-black text-slate-950 transition-colors group-hover:text-emerald-700">
                {product.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{product.category} / {region}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                {sellerName}
                <ShieldCheck size={14} className="text-emerald-700" />
                <span className="text-xs font-black uppercase tracking-wide text-emerald-700">Verified</span>
              </p>
            </div>
            <div className="flex gap-2 sm:hidden">
              <button
                onClick={handleCompare}
                className={`border p-2 ${isCompared ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
                title={isCompared ? 'Remove from comparison' : 'Add to comparison'}
              >
                {isCompared ? <Check size={18} /> : <Scale size={18} />}
              </button>
              <button
                onClick={handleWishlist}
                className={`border p-2 ${wishlisted ? 'border-red-200 bg-red-50 text-red-500' : 'border-slate-200 text-slate-500'}`}
              >
                <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xl font-black text-slate-950">
                {currency} {price}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">per {product.unit}</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">
                {product.quantity} {product.unit} available
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">quantity</p>
            </div>
            <div>
              <p className={`inline-flex items-center gap-1 font-bold ${demandTone}`}>
                {demandSignal}
                <ArrowUpRight size={15} />
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">response {responseTime}</p>
            </div>
          </div>
        </div>

        <div className="hidden min-w-[124px] flex-col items-end justify-between sm:flex">
          <div className="flex gap-2">
            <button
              onClick={handleCompare}
              className={`border p-2 ${isCompared ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:text-emerald-700'}`}
            >
              {isCompared ? <Check size={18} /> : <Scale size={18} />}
            </button>
            <button
              onClick={handleWishlist}
              className={`border p-2 ${wishlisted ? 'border-red-200 bg-red-50 text-red-500' : 'border-slate-200 text-slate-500 hover:text-red-500'}`}
            >
              <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
          <button className="inline-flex items-center gap-2 border border-emerald-300 px-3 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-50">
            <MessageSquare size={16} />
            Contact
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group cursor-pointer overflow-hidden border border-slate-200 bg-white transition-all duration-300 hover:border-emerald-300 hover:shadow-xl"
    >
      <div className="relative">
        <ImageBlock />

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent"
            />
          )}
        </AnimatePresence>

        <button
          onClick={handleWishlist}
          className={`absolute right-3 top-3 p-2.5 shadow-lg transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-white text-slate-400 hover:text-red-500'}`}
        >
          <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={handleCompare}
          className={`absolute left-3 top-3 p-2.5 shadow-lg transition-all ${isCompared ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:text-emerald-700'}`}
          title={isCompared ? 'Remove from comparison' : 'Compare'}
        >
          {isCompared ? <Check size={20} /> : <Scale size={20} />}
        </button>

        {product.quality === 'premium' && (
          <div className="absolute bottom-3 left-3 bg-amber-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-amber-900 shadow-md">
            Premium Quality
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-lg font-black text-slate-950 transition-colors group-hover:text-emerald-700">
            {product.name}
          </h3>
          {product.organic && (
            <span className="flex-shrink-0 border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-800">
              Organic
            </span>
          )}
        </div>

        <p className="mb-3 flex items-center gap-1 text-sm text-slate-500">
          <MapPin size={14} />
          {region}{product.country ? `, ${product.country}` : ''}
        </p>

        {product.category && (
          <p className="mb-3 text-sm font-semibold text-slate-600">{product.category}</p>
        )}

        <div className="flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-2xl font-black text-slate-950">
              {currency} {price}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">per {product.unit}</p>
          </div>
          <span className="border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700">
            {product.quantity} {product.unit}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
          <div>
            <p className={`font-black ${demandTone}`}>{demandSignal}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">demand</p>
          </div>
          <div>
            <p className="font-black text-slate-800">{responseTime}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">response</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
          <div className="flex h-8 w-8 items-center justify-center bg-emerald-100 text-sm font-black text-emerald-800">
            {sellerName?.[0]?.toUpperCase() || 'S'}
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{sellerName}</span>
          <span className="text-xs font-black uppercase tracking-wide text-emerald-700">Verified</span>
          <ShieldCheck size={16} className="text-emerald-700" />
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedProductCard;
