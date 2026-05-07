import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useUrlFilters = (defaultFilters = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getFiltersFromUrl = useCallback(() => {
    const filters = { ...defaultFilters };
    searchParams.forEach((value, key) => {
      filters[key] = value;
    });
    return filters;
  }, [searchParams, defaultFilters]);

  const [filters, setFilters] = useState(getFiltersFromUrl);

  useEffect(() => {
    const urlFilters = getFiltersFromUrl();
    setFilters(urlFilters);
  }, [getFiltersFromUrl]);

  const updateFilters = useCallback((newFilters) => {
    const updated = { ...filters, ...newFilters };
    
    // Remove empty values
    Object.keys(updated).forEach(key => {
      if (updated[key] === '' || updated[key] === null || updated[key] === undefined) {
        delete updated[key];
      }
    });
    
    setFilters(updated);
    setSearchParams(updated);
  }, [filters, setSearchParams]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchParams({});
  }, [defaultFilters, setSearchParams]);

  const setFilter = useCallback((key, value) => {
    updateFilters({ [key]: value });
  }, [updateFilters]);

  return {
    filters,
    setFilters: updateFilters,
    setFilter,
    resetFilters,
    searchParams
  };
};
