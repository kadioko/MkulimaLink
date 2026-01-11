import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, Package } from 'lucide-react';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

const SearchAutocomplete = ({ 
  placeholder = 'Search products, categories, regions...',
  onSearch,
  className = '',
  showRecent = true,
  showTrending = true
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mkulimalink_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
    
    // Load trending searches (could be from API)
    setTrendingSearches([
      { text: 'tomatoes', type: 'product', count: 1234 },
      { text: 'vegetables', type: 'category', count: 987 },
      { text: 'dar es salaam', type: 'region', count: 856 },
      { text: 'maize', type: 'product', count: 743 },
      { text: 'fruits', type: 'category', count: 621 }
    ]);
  }, []);

  // Debounced search function
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.length > 0) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
    }
  };

  // Handle search submission
  const handleSearch = (searchText = query) => {
    if (!searchText.trim()) return;

    // Add to recent searches
    const newRecent = [searchText, ...recentSearches.filter(s => s !== searchText)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('mkulimalink_recent_searches', JSON.stringify(newRecent));

    // Navigate to search results
    navigate(`/products?search=${encodeURIComponent(searchText)}`);
    
    // Close dropdown
    setIsOpen(false);
    setQuery('');
    setSuggestions([]);
    
    // Call external search handler
    if (onSearch) {
      onSearch(searchText);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    const searchText = suggestion.text || suggestion;
    handleSearch(searchText);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    const items = getSuggestionItems();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          handleSuggestionClick(items[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Get all suggestion items for navigation
  const getSuggestionItems = () => {
    const items = [];
    
    if (showRecent && recentSearches.length > 0 && query.length === 0) {
      items.push(...recentSearches.map(text => ({ text, type: 'recent' })));
    }
    
    if (showTrending && trendingSearches.length > 0 && query.length === 0) {
      items.push(...trendingSearches);
    }
    
    if (suggestions.length > 0) {
      items.push(...suggestions);
    }
    
    return items;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open dropdown on focus
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Render suggestion icon
  const renderIcon = (type) => {
    switch (type) {
      case 'recent':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'product':
        return <Package className="w-4 h-4 text-green-500" />;
      case 'category':
        return <div className="w-4 h-4 bg-blue-100 rounded" />;
      case 'region':
        return <div className="w-4 h-4 bg-purple-100 rounded" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  // Render suggestion item
  const renderSuggestionItem = (item, index) => {
    const isSelected = index === selectedIndex;
    
    return (
      <div
        key={`${item.type}-${item.text}-${index}`}
        className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
          isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => handleSuggestionClick(item)}
      >
        {renderIcon(item.type)}
        <div className="ml-3 flex-1">
          <div className="text-sm font-medium text-gray-900">
            {item.text}
          </div>
          {item.type === 'trending' && (
            <div className="text-xs text-gray-500">
              {item.count.toLocaleString()} searches
            </div>
          )}
        </div>
        {item.type === 'recent' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newRecent = recentSearches.filter(s => s !== item.text);
              setRecentSearches(newRecent);
              localStorage.setItem('mkulimalink_recent_searches', JSON.stringify(newRecent));
            }}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setSelectedIndex(-1);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <>
              {/* Recent Searches */}
              {showRecent && recentSearches.length > 0 && query.length === 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                    Recent Searches
                  </div>
                  {recentSearches.map((search, index) => 
                    renderSuggestionItem({ text: search, type: 'recent' }, index)
                  )}
                </div>
              )}

              {/* Trending Searches */}
              {showTrending && trendingSearches.length > 0 && query.length === 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                    Trending
                  </div>
                  {trendingSearches.map((item, index) => 
                    renderSuggestionItem(item, index + recentSearches.length)
                  )}
                </div>
              )}

              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                    Suggestions
                  </div>
                  {suggestions.map((item, index) => 
                    renderSuggestionItem(
                      item, 
                      index + recentSearches.length + trendingSearches.length
                    )
                  )}
                </div>
              )}

              {/* No results */}
              {query.length > 0 && suggestions.length === 0 && !isLoading && (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No suggestions found</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
