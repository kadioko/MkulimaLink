import { useState, useEffect, useRef, useCallback } from 'react';

export const useVirtualScroll = ({
  items,
  itemHeight,
  overscan = 5,
  containerHeight = 600,
  gap = 16,
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  const totalHeight = items.length * (itemHeight + gap) - gap;
  const totalItems = items.length;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const visibleCount = Math.ceil(containerHeight / (itemHeight + gap)) + overscan * 2;
    const endIndex = Math.min(totalItems, startIndex + visibleCount);

    setVisibleRange({ start: startIndex, end: endIndex });
  }, [scrollTop, itemHeight, containerHeight, overscan, totalItems, gap]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  
  const getItemStyle = useCallback((index) => ({
    position: 'absolute',
    top: index * (itemHeight + gap),
    height: itemHeight,
    left: 0,
    right: 0,
  }), [itemHeight, gap]);

  return {
    containerRef,
    visibleItems,
    visibleRange,
    totalHeight,
    getItemStyle,
    scrollTop,
  };
};

// Hook for infinite scroll
export const useInfiniteScroll = ({
  fetchMore,
  hasMore,
  threshold = 100,
  debounceMs = 200,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const lastElementRef = useCallback((node) => {
    if (isLoading || !hasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(async () => {
          setIsLoading(true);
          try {
            await fetchMore();
          } finally {
            setIsLoading(false);
          }
        }, debounceMs);
      }
    }, {
      rootMargin: `${threshold}px`,
    });

    if (node) observerRef.current.observe(node);
  }, [isLoading, hasMore, fetchMore, threshold, debounceMs]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { lastElementRef, isLoading };
};

export default useVirtualScroll;
