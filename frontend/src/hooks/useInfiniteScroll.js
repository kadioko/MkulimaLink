import { useState, useEffect, useCallback, useRef } from 'react';

export const useInfiniteScroll = (
  fetchFunction,
  options = {
    threshold: 100,
    initialPage: 1,
    pageSize: 20,
    enabled: true
  }
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(options.initialPage);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || loading || !hasMore || !options.enabled) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(page, options.pageSize);
      
      if (Array.isArray(result)) {
        setData(prev => page === options.initialPage ? result : [...prev, ...result]);
        setHasMore(result.length === options.pageSize);
        setPage(prev => prev + 1);
      } else if (result.data && Array.isArray(result.data)) {
        setData(prev => page === options.initialPage ? result.data : [...prev, ...result.data]);
        setHasMore(result.data.length === options.pageSize);
        setPage(prev => prev + 1);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      setError(err.message);
      console.error('Infinite scroll error:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchFunction, page, loading, hasMore, options.enabled, options.initialPage, options.pageSize]);

  const reset = useCallback(() => {
    setData([]);
    setPage(options.initialPage);
    setHasMore(true);
    setError(null);
    setLoading(false);
    loadingRef.current = false;
  }, [options.initialPage]);

  const refresh = useCallback(async () => {
    reset();
    await loadMore();
  }, [reset, loadMore]);

  // Intersection Observer
  const observerRef = useRef();
  const lastElementRef = useCallback(node => {
    if (loading || !options.enabled) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, {
      threshold: 0.1,
      rootMargin: `${options.threshold}px`
    });
    
    if (node) {
      observerRef.current.observe(node);
    }
  }, [loading, hasMore, loadMore, options.threshold, options.enabled]);

  // Manual scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - options.threshold &&
        !loading &&
        hasMore &&
        options.enabled
      ) {
        loadMore();
      }
    };

    if (options.enabled) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [loading, hasMore, loadMore, options.threshold, options.enabled]);

  // Initial load
  useEffect(() => {
    if (options.enabled && data.length === 0 && !loading) {
      loadMore();
    }
  }, [options.enabled, data.length, loading, loadMore]);

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    refresh,
    lastElementRef
  };
};

// Hook for virtualized infinite scroll (better performance for large lists)
export const useVirtualInfiniteScroll = (
  fetchFunction,
  options = {
    threshold: 100,
    initialPage: 1,
    pageSize: 20,
    itemHeight: 60,
    containerHeight: 400,
    enabled: true
  }
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(options.initialPage);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !options.enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(page, options.pageSize);
      
      if (Array.isArray(result)) {
        setData(prev => [...prev, ...result]);
        setHasMore(result.length === options.pageSize);
        setPage(prev => prev + 1);
      } else if (result.data && Array.isArray(result.data)) {
        setData(prev => [...prev, ...result.data]);
        setHasMore(result.data.length === options.pageSize);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, loading, hasMore, options.enabled, options.pageSize]);

  const reset = useCallback(() => {
    setData([]);
    setPage(options.initialPage);
    setHasMore(true);
    setError(null);
    setLoading(false);
    setScrollTop(0);
  }, [options.initialPage]);

  // Calculate visible items
  const visibleStartIndex = Math.floor(scrollTop / options.itemHeight);
  const visibleEndIndex = Math.min(
    visibleStartIndex + Math.ceil(options.containerHeight / options.itemHeight) + 1,
    data.length
  );
  const visibleItems = data.slice(visibleStartIndex, visibleEndIndex);

  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);

    // Load more when near bottom
    if (
      newScrollTop + options.containerHeight >=
      data.length * options.itemHeight - options.threshold &&
      !loading &&
      hasMore &&
      options.enabled
    ) {
      loadMore();
    }
  }, [loading, hasMore, loadMore, options.threshold, options.enabled, data.length]);

  // Initial load
  useEffect(() => {
    if (options.enabled && data.length === 0 && !loading) {
      loadMore();
    }
  }, [options.enabled, data.length, loading, loadMore]);

  return {
    data: visibleItems,
    allData: data,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    containerRef,
    handleScroll,
    visibleStartIndex,
    visibleEndIndex,
    totalHeight: data.length * options.itemHeight
  };
};

export default useInfiniteScroll;
