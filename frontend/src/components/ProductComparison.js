import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Minus, User, Award } from 'lucide-react';

const ProductComparison = ({ products, onRemove, onClear, currency }) => {
  if (!products || products.length === 0) return null;

  const attributes = [
    { key: 'price', label: 'Price', format: (val) => `${currency} ${typeof val === 'number' ? val.toLocaleString() : val}` },
    { key: 'quantity', label: 'Quantity', format: (val, unit) => `${val} ${unit}` },
    { key: 'category', label: 'Category' },
    { key: 'region', label: 'Region' },
    { key: 'quality', label: 'Quality' },
    { key: 'organic', label: 'Organic', format: (val) => val ? 'Yes' : 'No' },
  ];

  const getBestValue = (key) => {
    if (key === 'price') {
      const prices = products.map(p => typeof p.price === 'number' ? p.price : parseFloat(p.price));
      const minPrice = Math.min(...prices);
      return products.find(p => (typeof p.price === 'number' ? p.price : parseFloat(p.price)) === minPrice)?._id;
    }
    if (key === 'quantity') {
      const quantities = products.map(p => typeof p.quantity === 'number' ? p.quantity : parseFloat(p.quantity));
      const maxQty = Math.max(...quantities);
      return products.find(p => (typeof p.quantity === 'number' ? p.quantity : parseFloat(p.quantity)) === maxQty)?._id;
    }
    return null;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40 p-4"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900">Compare Products</h3>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                {products.length} items
              </span>
            </div>
            <div className="flex gap-3">
              <motion.button
                onClick={onClear}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-500 hover:text-red-500 font-medium text-sm"
              >
                Clear all
              </motion.button>
              <motion.button
                onClick={onClear}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
              >
                Done
              </motion.button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="grid" style={{ gridTemplateColumns: `150px repeat(${products.length}, minmax(200px, 1fr))` }}>
              {/* Header Row */}
              <div className="p-3 border-b border-gray-100"></div>
              {products.map((product) => (
                <div key={product._id} className="p-3 border-b border-gray-100 relative">
                  <motion.button
                    onClick={() => onRemove(product._id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </motion.button>
                  <div className="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">🌾</span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{product.name}</h4>
                </div>
              ))}

              {/* Attribute Rows */}
              {attributes.map((attr) => {
                const bestId = getBestValue(attr.key);
                return (
                  <React.Fragment key={attr.key}>
                    <div className="p-3 border-b border-gray-100 text-sm font-medium text-gray-500 bg-gray-50">
                      {attr.label}
                    </div>
                    {products.map((product) => {
                      const isBest = product._id === bestId && products.length > 1;
                      const value = attr.format 
                        ? attr.format(product[attr.key], product.unit)
                        : product[attr.key];
                      
                      return (
                        <div 
                          key={`${product._id}-${attr.key}`} 
                          className={`p-3 border-b border-gray-100 text-sm ${isBest ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700'}`}
                        >
                          <div className="flex items-center gap-1">
                            {isBest && <Award size={14} className="text-green-600" />}
                            {value || <Minus size={14} className="text-gray-300" />}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Seller Row */}
              <div className="p-3 text-sm font-medium text-gray-500 bg-gray-50">
                <User size={14} className="inline mr-1" /> Seller
              </div>
              {products.map((product) => (
                <div key={`${product._id}-seller`} className="p-3 text-sm text-gray-700">
                  {product.seller ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.seller.name}</span>
                      {product.seller.verified && (
                        <Check size={12} className="text-blue-500" />
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">Unknown</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductComparison;
