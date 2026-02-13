import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, Filter, MapPin, Heart } from 'lucide-react';
import api from '../api/axios';
import { demoProducts } from '../utils/demoData';
import { useCountryStore, COUNTRIES } from '../store/countryStore';

function Products() {
  const { country, getCurrency } = useCountryStore();
  const currency = getCurrency();
  const currentCountry = COUNTRIES[country];

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    region: '',
    minPrice: '',
    maxPrice: '',
    quality: '',
    organic: ''
  });
  const { data, isLoading } = useQuery(
    ['products', filters, country],
    async () => {
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        params.append('limit', '12');
        params.append('country', country);
        
        const response = await api.get(`/api/products?${params}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching products:', error);
        return { products: demoProducts, totalPages: 1 };
      }
    }
  );

  const categories = [
    'grains', 'vegetables', 'fruits', 'livestock', 
    'dairy', 'poultry', 'seeds', 'fertilizers', 'equipment'
  ];

  const regions = currentCountry.regions;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Products</h1>
        
        <div className="card mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input-field pl-10"
              />
            </div>
            <button className="btn-outline flex items-center gap-2">
              <Filter size={20} />
              <span>Filters</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>

            <select
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              className="input-field"
            >
              <option value="">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            <select
              value={filters.quality}
              onChange={(e) => setFilters({ ...filters, quality: e.target.value })}
              className="input-field"
            >
              <option value="">All Quality</option>
              <option value="premium">Premium</option>
              <option value="standard">Standard</option>
              <option value="economy">Economy</option>
            </select>

            <select
              value={filters.organic}
              onChange={(e) => setFilters({ ...filters, organic: e.target.value })}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="true">Organic Only</option>
              <option value="false">Non-Organic</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-48 rounded-lg mb-4"></div>
              <div className="skeleton h-6 w-3/4 mb-2"></div>
              <div className="skeleton h-4 w-1/2"></div>
            </div>
          ))}
        </div>
      ) : data && data.products && Array.isArray(data.products) ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.products.map((product, index) => {
              if (!product || !product.name) return null;
              return (
                <div
                  key={index}
                  className="card hover:shadow-xl transition-shadow group"
                >
                  <div className="relative mb-4">
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">Product Image</span>
                    </div>
                    <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                      <Heart size={20} className="text-gray-600" />
                    </button>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600">
                    {product.name || 'Product'}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3">High quality {product.category || 'product'} from {product.region || currentCountry.name}</p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-primary-600">
                        {product.currency || currency} {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
                      </p>
                      <p className="text-sm text-gray-500">per {product.unit || 'unit'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{product.quantity || 0} {product.unit || 'unit'}</p>
                      <span className="badge badge-info">
                        {product.category || 'Other'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin size={16} className="mr-1" />
                    <span>{product.region || 'Tanzania'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {data.products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Unable to load products. Please try again.</p>
        </div>
      )}
    </div>
  );
}

export default Products;
