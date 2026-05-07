import React, { useState, useCallback } from 'react';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid3X3, List, X, SlidersHorizontal } from 'lucide-react';
import api from '../api/axios';
import { demoProducts } from '../utils/demoData';
import { useCountryStore, COUNTRIES } from '../store/countryStore';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { useDebounce } from '../hooks/useDebounce';
import { useToastContext } from '../App';
import EnhancedProductCard from '../components/EnhancedProductCard';
import ProductComparison from '../components/ProductComparison';
import { ProductGridSkeleton, EmptyState, ErrorState } from '../components/EnhancedSkeleton';

function Products() {
  const { country, getCurrency } = useCountryStore();
  const currency = getCurrency();
  const currentCountry = COUNTRIES[country];
  const { success, info } = useToastContext();
  
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [compareList, setCompareList] = useState([]);
  
  const { filters, setFilters, resetFilters } = useUrlFilters({
    search: '',
    category: '',
    region: '',
    quality: '',
    organic: ''
  });
  
  const debouncedSearch = useDebounce(filters.search, 400);

  const { data, isLoading, error, refetch } = useQuery(
    ['products', { ...filters, search: debouncedSearch }, country],
    async () => {
      try {
        const params = new URLSearchParams();
        Object.entries({ ...filters, search: debouncedSearch }).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        params.append('limit', '12');
        params.append('country', country);
        
        const response = await api.get(`/api/products?${params}`);
        return response.data;
      } catch (err) {
        console.error('Error fetching products:', err);
        return { products: demoProducts, totalPages: 1 };
      }
    },
    {
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000,
    }
  );

  const categories = [
    'Grains', 'Vegetables', 'Fruits', 'Livestock',
    'Dairy', 'Poultry', 'Seeds', 'Fertilizers', 'Inputs',
    ...(country === 'KE' ? ['Cash Crops'] : []),
    'Equipment'
  ];

  const regions = currentCountry.regions;

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  const handleCompareToggle = useCallback((product) => {
    setCompareList(prev => {
      const exists = prev.find(p => p._id === product._id);
      if (exists) {
        info('Removed from comparison');
        return prev.filter(p => p._id !== product._id);
      }
      if (prev.length >= 4) {
        info('You can compare up to 4 products');
        return prev;
      }
      success('Added to comparison');
      return [...prev, product];
    });
  }, [success, info]);

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Products</h1>
          <p className="text-gray-500 mt-1">
            {data?.products?.length || 0} products available in {currentCountry.flag} {currentCountry.name}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}
            >
              <Grid3X3 size={20} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}
            >
              <List size={20} />
            </motion.button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal size={18} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products, categories, regions..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
          />
          {filters.search && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => handleFilterChange('search', '')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  <option value="">All Regions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                <select
                  value={filters.quality}
                  onChange={(e) => handleFilterChange('quality', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  <option value="">All Quality</option>
                  <option value="premium">Premium</option>
                  <option value="standard">Standard</option>
                  <option value="economy">Economy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.organic}
                  onChange={(e) => handleFilterChange('organic', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  <option value="">All Types</option>
                  <option value="true">Organic Only</option>
                  <option value="false">Non-Organic</option>
                </select>
              </div>
            </div>
            
            {activeFiltersCount > 0 && (
              <div className="px-4 pb-4 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X size={14} />
                  Clear all filters
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Grid/List */}
      {isLoading ? (
        <ProductGridSkeleton count={6} viewMode={viewMode} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : data?.products?.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No products found"
          description="Try adjusting your search or filters to find what you're looking for."
          action={resetFilters}
          actionLabel="Clear filters"
        />
      ) : (
        <motion.div
          layout
          className={viewMode === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }
        >
          <AnimatePresence mode="popLayout">
            {data.products.map((product, index) => (
              <EnhancedProductCard
                key={product._id || index}
                product={product}
                currency={currency}
                index={index}
                viewMode={viewMode}
                onCompare={handleCompareToggle}
                isCompared={compareList.some(p => p._id === product._id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Comparison Panel */}
      <ProductComparison
        products={compareList}
        onRemove={(id) => setCompareList(prev => prev.filter(p => p._id !== id))}
        onClear={() => setCompareList([])}
        currency={currency}
      />
    </div>
  );
}

export default Products;
