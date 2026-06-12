import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star, Loader } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config/env';
import './AdvancedSearch.css';

export default function AdvancedSearch() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [filters, setFilters] = useState({
    category: '',
    region: '',
    minPrice: '',
    maxPrice: '',
    quality: '',
    organic: false,
    sortBy: '-createdAt'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const categories = [
    'vegetables', 'grains', 'fruits', 'livestock', 'dairy',
    'poultry', 'seeds', 'fertilizers', 'equipment', 'other'
  ];

  const regions = [
    'Dar es Salaam', 'Morogoro', 'Arusha', 'Iringa', 'Mbeya',
    'Mwanza', 'Dodoma', 'Kilimanjaro'
  ];

  const sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-views', label: 'Most Popular' },
    { value: '-rating', label: 'Highest Rated' }
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchQuery,
        category: filters.category,
        region: filters.region,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        quality: filters.quality,
        organic: filters.organic,
        sort: filters.sortBy,
        page: pagination.page,
        limit: pagination.limit
      };

      const response = await axios.get(
        `${API_URL}/api/products`,
        { params }
      );

      setProducts(response.data.products);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.totalPages
      }));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const response = await axios.get(
            `${API_URL}/api/search/autocomplete`,
            { params: { q: searchQuery, limit: 10 } }
          );
          setSuggestions(response.data.suggestions || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Autocomplete error:', error);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  // Fetch products when filters or pagination changes
  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.page]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product') {
      setSearchQuery(suggestion.text);
    } else if (suggestion.type === 'category') {
      setFilters(prev => ({ ...prev, category: suggestion.text }));
    }
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      category: '',
      region: '',
      minPrice: '',
      maxPrice: '',
      quality: '',
      organic: false,
      sortBy: '-createdAt'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="advanced-search-container">
      <div className="search-header">
        <h1>Find Agricultural Products</h1>
        <p>Search through thousands of products from farmers across East Africa</p>
      </div>

      <div className="search-layout">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <Filter size={20} />
            <h2>Filters</h2>
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All
            </button>
          </div>

          {/* Search Box */}
          <div className="filter-group">
            <label>Search Products</label>
            <div className="search-input-wrapper">
              <Search size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="suggestion-item"
                    >
                      <span className="suggestion-text">{suggestion.text}</span>
                      <span className="suggestion-type">{suggestion.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          <div className="filter-group">
            <label htmlFor="region">Region</label>
            <select
              id="region"
              name="region"
              value={filters.region}
              onChange={handleFilterChange}
            >
              <option value="">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <label>Price Range (TZS)</label>
            <div className="price-inputs">
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min"
                min="0"
              />
              <span>-</span>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max"
                min="0"
              />
            </div>
          </div>

          {/* Quality Filter */}
          <div className="filter-group">
            <label htmlFor="quality">Quality</label>
            <select
              id="quality"
              name="quality"
              value={filters.quality}
              onChange={handleFilterChange}
            >
              <option value="">All Qualities</option>
              <option value="premium">Premium</option>
              <option value="standard">Standard</option>
              <option value="economy">Economy</option>
            </select>
          </div>

          {/* Organic Filter */}
          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                name="organic"
                checked={filters.organic}
                onChange={handleFilterChange}
              />
              <span>Organic Products Only</span>
            </label>
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label htmlFor="sortBy">Sort By</label>
            <select
              id="sortBy"
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* Results Section */}
        <main className="search-results">
          <div className="results-header">
            <h2>
              {pagination.total} Products Found
              {searchQuery && ` for "${searchQuery}"`}
            </h2>
          </div>

          {loading ? (
            <div className="loading-state">
              <Loader size={40} className="spinner" />
              <p>Searching products...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="products-grid">
                {products.map(product => (
                  <div key={product._id} className="product-card">
                    {product.images && product.images.length > 0 && (
                      <div className="product-image">
                        <img src={product.images[0].url} alt={product.name} />
                        {product.organic && <span className="organic-badge">Organic</span>}
                      </div>
                    )}
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="category">{product.category}</p>
                      <div className="product-meta">
                        <span className="price">{product.price} TZS/{product.unit}</span>
                        <span className="quantity">{product.quantity} {product.unit} available</span>
                      </div>
                      <div className="seller-info">
                        <MapPin size={14} />
                        <span>{product.location?.region}</span>
                      </div>
                      {product.seller && (
                        <div className="seller-rating">
                          <Star size={14} fill="currentColor" />
                          <span>{product.seller.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      )}
                      <button className="view-btn">View Details</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Search size={48} />
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
