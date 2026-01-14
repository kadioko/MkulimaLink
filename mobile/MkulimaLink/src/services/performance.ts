import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PerformanceMetrics {
  appStartTime: number;
  memoryUsage: number;
  networkRequests: number;
  renderTime: number;
  frameDrops: number;
}

class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetrics;
  private startTime: number;
  private renderStartTime: number;
  private frameCount: number;
  private lastFrameTime: number;

  private constructor() {
    this.startTime = Date.now();
    this.renderStartTime = 0;
    this.frameCount = 0;
    this.lastFrameTime = 0;

    this.metrics = {
      appStartTime: this.startTime,
      memoryUsage: 0,
      networkRequests: 0,
      renderTime: 0,
      frameDrops: 0,
    };
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Get device screen dimensions and pixel ratio
   */
  getDeviceInfo() {
    const { width, height } = Dimensions.get('window');
    const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

    return {
      screenWidth,
      screenHeight,
      windowWidth: width,
      windowHeight: height,
      pixelRatio: Dimensions.get('window').scale,
      isTablet: width >= 768,
      platform: Platform.OS,
      version: Platform.Version,
    };
  }

  /**
   * Start measuring render time
   */
  startRenderMeasurement() {
    this.renderStartTime = Date.now();
  }

  /**
   * End measuring render time
   */
  endRenderMeasurement(componentName?: string) {
    if (this.renderStartTime > 0) {
      const renderTime = Date.now() - this.renderStartTime;
      this.metrics.renderTime = renderTime;

      if (__DEV__) {
        console.log(`Render time for ${componentName || 'component'}: ${renderTime}ms`);
      }

      this.renderStartTime = 0;
      return renderTime;
    }
    return 0;
  }

  /**
   * Monitor frame rate
   */
  monitorFrameRate(callback?: (fps: number) => void) {
    const measureFrame = () => {
      const now = Date.now();
      const deltaTime = now - this.lastFrameTime;

      if (this.lastFrameTime > 0) {
        const fps = Math.round(1000 / deltaTime);
        this.frameCount++;

        // Detect frame drops (assuming 60fps target)
        if (fps < 55) {
          this.metrics.frameDrops++;
        }

        if (callback) {
          callback(fps);
        }

        if (__DEV__ && this.frameCount % 60 === 0) {
          console.log(`Average FPS: ${fps}`);
        }
      }

      this.lastFrameTime = now;
      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  /**
   * Get memory usage (limited on mobile)
   */
  async getMemoryUsage() {
    // Memory monitoring is limited on React Native
    // This is a placeholder for potential future implementation
    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  }

  /**
   * Track network requests
   */
  trackNetworkRequest() {
    this.metrics.networkRequests++;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Log performance metrics to console (development only)
   */
  logMetrics() {
    if (__DEV__) {
      console.log('Performance Metrics:', this.getMetrics());
    }
  }

  /**
   * Save metrics to storage for analysis
   */
  async saveMetrics() {
    try {
      const metricsToSave = {
        ...this.getMetrics(),
        timestamp: Date.now(),
        deviceInfo: this.getDeviceInfo(),
      };

      await AsyncStorage.setItem('performance_metrics', JSON.stringify(metricsToSave));
    } catch (error) {
      console.error('Failed to save performance metrics:', error);
    }
  }

  /**
   * Clear cached data to free memory
   */
  async clearCache() {
    try {
      // Clear image cache
      await AsyncStorage.removeItem('image_cache');

      // Clear other cached data
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);

      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Optimize image loading with progressive loading
   */
  createProgressiveImageLoader() {
    return {
      loadImage: async (uri: string, onProgress?: (progress: number) => void) => {
        // Simulate progressive loading
        return new Promise((resolve, reject) => {
          // In a real implementation, you would use libraries like
          // react-native-progressive-image or implement custom progressive loading
          resolve(uri);
        });
      },
    };
  }
}

// Create singleton instance
export const performanceService = PerformanceService.getInstance();

// React hooks for performance optimization
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [fps, setFps] = useState<number>(60);

  useEffect(() => {
    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      setMetrics(performanceService.getMetrics());
    }, 5000);

    // Monitor frame rate
    performanceService.monitorFrameRate((currentFps) => {
      setFps(currentFps);
    });

    return () => {
      clearInterval(interval);
    };
  }, []);

  const startRenderMeasurement = useCallback(() => {
    performanceService.startRenderMeasurement();
  }, []);

  const endRenderMeasurement = useCallback((componentName?: string) => {
    return performanceService.endRenderMeasurement(componentName);
  }, []);

  const logMetrics = useCallback(() => {
    performanceService.logMetrics();
  }, []);

  const saveMetrics = useCallback(async () => {
    await performanceService.saveMetrics();
  }, []);

  const clearCache = useCallback(async () => {
    await performanceService.clearCache();
  }, []);

  return {
    metrics,
    fps,
    startRenderMeasurement,
    endRenderMeasurement,
    logMetrics,
    saveMetrics,
    clearCache,
  };
};

export const useDeviceInfo = () => {
  return performanceService.getDeviceInfo();
};

export const useProgressiveImage = () => {
  return performanceService.createProgressiveImageLoader();
};

// Memory optimization utilities
export const useMemoryOptimization = () => {
  const imageRefs = useRef<Map<string, any>>(new Map());

  const preloadImage = useCallback((uri: string) => {
    // Preload image into cache
    imageRefs.current.set(uri, { loaded: false });

    // In a real implementation, you would preload the image
    // and mark it as loaded when complete
  }, []);

  const unloadImage = useCallback((uri: string) => {
    // Remove image from memory
    imageRefs.current.delete(uri);
  }, []);

  const clearImageCache = useCallback(() => {
    // Clear all cached images
    imageRefs.current.clear();
  }, []);

  return {
    preloadImage,
    unloadImage,
    clearImageCache,
  };
};

// List virtualization optimization
export const useOptimizedList = (data: any[], itemHeight: number = 50) => {
  const { height: screenHeight } = Dimensions.get('window');
  const visibleItems = Math.ceil(screenHeight / itemHeight) + 2; // Add buffer

  const getItemLayout = useCallback((data: any[], index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  }), [itemHeight]);

  const keyExtractor = useCallback((item: any, index: number) => {
    return item.id || item._id || `item-${index}`;
  }, []);

  return {
    getItemLayout,
    keyExtractor,
    initialNumToRender: visibleItems,
    maxToRenderPerBatch: visibleItems,
    windowSize: visibleItems * 2,
    removeClippedSubviews: true,
    updateCellsBatchingPeriod: 50,
  };
};

// Network optimization
export const useNetworkOptimization = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // In a real implementation, you would monitor network status
    // and adjust API calls accordingly
  }, []);

  const makeRequest = useCallback(async (requestFn: () => Promise<any>) => {
    if (!isOnline) {
      // Queue request for when back online
      return null;
    }

    try {
      const result = await requestFn();
      performanceService.trackNetworkRequest();
      return result;
    } catch (error) {
      console.error('Network request failed:', error);
      throw error;
    }
  }, [isOnline]);

  return {
    isOnline,
    makeRequest,
  };
};

export default performanceService;
