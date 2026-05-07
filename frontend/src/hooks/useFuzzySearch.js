import { useMemo, useCallback } from 'react';

// Simple fuzzy search implementation (lighter than Fuse.js for small datasets)
const createFuzzySearcher = (items, keys, options = {}) => {
  const { threshold = 0.6 } = options;

  const calculateScore = (text, query) => {
    if (!query) return 1;
    if (!text) return 0;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact match
    if (textLower === queryLower) return 1;
    
    // Starts with
    if (textLower.startsWith(queryLower)) return 0.9;
    
    // Contains
    if (textLower.includes(queryLower)) return 0.7;
    
    // Fuzzy match using simple Levenshtein-like distance
    const maxLength = Math.max(textLower.length, queryLower.length);
    if (maxLength === 0) return 1;
    
    let matches = 0;
    let queryIndex = 0;
    
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        matches++;
        queryIndex++;
      }
    }
    
    const matchRatio = matches / queryLower.length;
    return matchRatio >= threshold ? matchRatio * 0.5 : 0;
  };

  return (query) => {
    if (!query || query.trim() === '') {
      return items.map(item => ({ item, score: 1 }));
    }

    const results = items.map(item => {
      let bestScore = 0;
      
      for (const key of keys) {
        const value = key.split('.').reduce((obj, k) => obj?.[k], item);
        if (typeof value === 'string') {
          const score = calculateScore(value, query);
          bestScore = Math.max(bestScore, score);
        }
      }
      
      return { item, score: bestScore };
    });

    return results
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score);
  };
};

export const useFuzzySearch = (items, keys, options = {}) => {
  const searcher = useMemo(
    () => createFuzzySearcher(items, keys, options),
    [items, keys, options]
  );

  const search = useCallback(
    (query) => searcher(query),
    [searcher]
  );

  return { search };
};

// Hook for recent searches with localStorage persistence
export const useRecentSearches = (key = 'recent-searches', maxItems = 10) => {
  const getRecent = useCallback(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [key]);

  const addSearch = useCallback((query) => {
    if (!query || query.trim() === '') return;
    
    const recent = getRecent();
    const newRecent = [
      { query: query.trim(), timestamp: Date.now() },
      ...recent.filter(item => item.query !== query.trim()),
    ].slice(0, maxItems);
    
    localStorage.setItem(key, JSON.stringify(newRecent));
  }, [key, maxItems, getRecent]);

  const removeSearch = useCallback((query) => {
    const recent = getRecent();
    const filtered = recent.filter(item => item.query !== query);
    localStorage.setItem(key, JSON.stringify(filtered));
  }, [key, getRecent]);

  const clearSearches = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  const recentSearches = getRecent();

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
  };
};

export default useFuzzySearch;
