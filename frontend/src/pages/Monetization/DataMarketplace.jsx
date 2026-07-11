import React, { useState, useEffect } from 'react';
import { Search, Download, Star, TrendingUp, BarChart3, Users } from 'lucide-react';
import api from '../../api/axios';

const DataMarketplace = () => {
  const [products, setProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    'market_reports',
    'price_trends',
    'demand_forecasts',
    'competitor_analysis',
    'regional_insights'
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [searchRes, popularRes] = await Promise.all([
        api.get('/api/monetization/data-products/search', {
          params: { query: searchQuery, category: selectedCategory }
        }),
        api.get('/api/monetization/data-products/popular')
      ]);

      setProducts(searchRes.data.products || []);
      setPopularProducts(popularRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handlePurchase = async (productId) => {
    try {
      await api.post(`/api/monetization/data-products/${productId}/purchase`);
      alert('Product purchased successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading marketplace...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Data Marketplace</h1>
          <p className="text-gray-600">Access premium market insights and agricultural data</p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search data products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Category</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  selectedCategory === null
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm transition capitalize ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Products */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-indigo-600" />
            Popular Data Products
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularProducts.map((product) => (
              <DataProductCard
                key={product._id}
                product={product}
                onPurchase={() => handlePurchase(product._id)}
              />
            ))}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Results</h2>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <DataProductCard
                    key={product._id}
                    product={product}
                    onPurchase={() => handlePurchase(product._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No data products found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DataProductCard = ({ product, onPurchase }) => (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-32 flex items-center justify-center">
      <BarChart3 className="w-16 h-16 text-white opacity-50" />
    </div>

    <div className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{product.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

      <div className="space-y-2 mb-4 text-sm text-gray-600">
        <div className="flex items-center">
          <Download className="w-4 h-4 mr-2 text-indigo-600" />
          {product.downloads || 0} downloads
        </div>
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2 text-indigo-600" />
          {product.sales_count || 0} purchases
        </div>
        {product.rating > 0 && (
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-400" />
            {product.rating.toFixed(1)} ({product.reviews_count || 0} reviews)
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-semibold capitalize">
          {product.category?.replace('_', ' ')}
        </span>
        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold capitalize">
          {product.data_type}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-gray-900">{product.price} TZS</span>
        <button
          onClick={onPurchase}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          Purchase
        </button>
      </div>
    </div>
  </div>
);

export default DataMarketplace;
