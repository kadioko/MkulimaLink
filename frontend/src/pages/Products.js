import React, { useState, useCallback } from 'react';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Grid3X3, List, MapPin, Search, ShieldCheck, SlidersHorizontal, Sprout, X } from 'lucide-react';
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
      initialData: { products: demoProducts, totalPages: 1, isDemo: true },
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
  const productCount = data?.products?.length || 0;
  const marketplaceStats = [
    { label: 'Available lots', value: productCount || '12+', icon: Sprout },
    { label: 'Active regions', value: regions.length, icon: MapPin },
    { label: 'Verified sellers', value: '94%', icon: ShieldCheck },
    { label: 'Price signals', value: 'Live', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-slate-200 bg-white p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Marketplace supply</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Find produce with price context.</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Browse active lots in {currentCountry.name}, compare sellers, and filter by crop, region, grade, and organic status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                title="Grid view"
              >
                <Grid3X3 size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                title="List view"
              >
                <List size={20} />
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 border px-4 py-2 font-bold transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800' 
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <SlidersHorizontal size={18} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center bg-emerald-700 text-xs font-black text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {marketplaceStats.map((stat) => (
            <div key={stat.label} className="border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl font-black text-slate-950">{stat.value}</p>
                <stat.icon size={20} className="text-emerald-700" />
              </div>
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border border-slate-200 bg-white p-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search products, categories, regions..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full border border-slate-200 bg-slate-50 py-3 pl-12 pr-11 font-semibold text-slate-900 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          {filters.search && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => handleFilterChange('search', '')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </motion.button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border border-slate-200 bg-white"
          >
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Region</label>
                <select
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">All Regions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Quality</label>
                <select
                  value={filters.quality}
                  onChange={(e) => handleFilterChange('quality', e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">All Quality</option>
                  <option value="premium">Premium</option>
                  <option value="standard">Standard</option>
                  <option value="economy">Economy</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Type</label>
                <select
                  value={filters.organic}
                  onChange={(e) => handleFilterChange('organic', e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">All Types</option>
                  <option value="true">Organic Only</option>
                  <option value="false">Non-Organic</option>
                </select>
              </div>
            </div>
            
            {activeFiltersCount > 0 && (
              <div className="flex justify-end px-4 pb-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-700"
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
            ? "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
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
