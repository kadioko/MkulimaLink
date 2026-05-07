import { useCallback, useEffect, useRef } from 'react';

// Simple analytics tracking hook
export const useAnalytics = () => {
  const sessionStartTime = useRef(Date.now());
  const pageViews = useRef([]);

  const trackEvent = useCallback((eventName, properties = {}) => {
    const event = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        sessionDuration: Date.now() - sessionStartTime.current,
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      },
    };

    // In production, send to analytics service
    if (process.env.REACT_APP_ANALYTICS_KEY) {
      // Send to your analytics provider (e.g., Google Analytics, Mixpanel, Amplitude)
      console.log('[Analytics]', event);
      
      // Example: gtag('event', eventName, properties);
      // Example: mixpanel.track(eventName, properties);
    } else {
      console.log('[Analytics - Dev]', event);
    }

    // Store in localStorage for offline tracking
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push(event);
      localStorage.setItem('analytics_events', JSON.stringify(events.slice(-100))); // Keep last 100
    } catch {
      // Ignore storage errors
    }
  }, []);

  const trackPageView = useCallback((page, properties = {}) => {
    const pageView = {
      page,
      timestamp: new Date().toISOString(),
      ...properties,
    };
    
    pageViews.current.push(pageView);
    trackEvent('page_view', { page, ...properties });
  }, [trackEvent]);

  const trackProductView = useCallback((product) => {
    trackEvent('product_view', {
      product_id: product._id,
      product_name: product.name,
      product_category: product.category,
      product_price: product.price,
      product_region: product.region,
    });
  }, [trackEvent]);

  const trackAddToWishlist = useCallback((product) => {
    trackEvent('add_to_wishlist', {
      product_id: product._id,
      product_name: product.name,
      product_price: product.price,
    });
  }, [trackEvent]);

  const trackAddToCompare = useCallback((product) => {
    trackEvent('add_to_compare', {
      product_id: product._id,
      product_name: product.name,
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query, resultsCount, filters = {}) => {
    trackEvent('search', {
      search_query: query,
      results_count: resultsCount,
      filters: JSON.stringify(filters),
    });
  }, [trackEvent]);

  const trackFilterChange = useCallback((filterName, value) => {
    trackEvent('filter_change', {
      filter_name: filterName,
      filter_value: value,
    });
  }, [trackEvent]);

  const trackCTA = useCallback((ctaName, ctaLocation) => {
    trackEvent('cta_click', {
      cta_name: ctaName,
      cta_location: ctaLocation,
    });
  }, [trackEvent]);

  const trackError = useCallback((error, errorInfo = {}) => {
    trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      error_type: error.name,
      ...errorInfo,
    });
  }, [trackEvent]);

  const trackPerformance = useCallback((metricName, value, rating = 'good') => {
    trackEvent('web_vitals', {
      metric_name: metricName,
      metric_value: value,
      metric_rating: rating,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackProductView,
    trackAddToWishlist,
    trackAddToCompare,
    trackSearch,
    trackFilterChange,
    trackCTA,
    trackError,
    trackPerformance,
  };
};

// Hook to track Core Web Vitals
export const useWebVitals = () => {
  const { trackPerformance } = useAnalytics();

  useEffect(() => {
    if (!('web-vitals' in window)) return;

    // Dynamically import web-vitals for performance
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => trackPerformance('CLS', metric.value, metric.rating));
      getFID((metric) => trackPerformance('FID', metric.value, metric.rating));
      getFCP((metric) => trackPerformance('FCP', metric.value, metric.rating));
      getLCP((metric) => trackPerformance('LCP', metric.value, metric.rating));
      getTTFB((metric) => trackPerformance('TTFB', metric.value, metric.rating));
    });
  }, [trackPerformance]);
};

// Hook to track user engagement time
export const useEngagementTime = (threshold = 10000) => {
  const { trackEvent } = useAnalytics();
  const startTime = useRef(Date.now());
  const hasTriggered = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const timeSpent = Date.now() - startTime.current;
        
        if (timeSpent >= threshold && !hasTriggered.current) {
          trackEvent('engagement', {
            time_spent: timeSpent,
            threshold,
          });
          hasTriggered.current = true;
        }
      } else {
        startTime.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      handleVisibilityChange(); // Track on unmount
    };
  }, [threshold, trackEvent]);
};

export default useAnalytics;
