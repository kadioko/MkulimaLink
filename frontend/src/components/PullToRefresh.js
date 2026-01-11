import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const PullToRefresh = ({ onRefresh, children, className = '', threshold = 80 }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef();

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.min((currentY.current - startY.current) * 0.5, threshold * 1.5);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(distance);
    }
  }, [isPulling, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    setIsPulling(false);
    startY.current = 0;
    currentY.current = 0;
  }, [isPulling, pullDistance, threshold, onRefresh, isRefreshing]);

  const handleWheel = useCallback((e) => {
    if (window.scrollY === 0 && e.deltaY < 0 && !isPulling && !isRefreshing) {
      startY.current = e.clientY;
      setIsPulling(true);
    }
  }, [isPulling, isRefreshing]);

  const handleWheelMove = useCallback((e) => {
    if (!isPulling) return;

    const distance = Math.min((e.clientY - startY.current) * 0.5, threshold * 1.5);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(distance);
    }
  }, [isPulling, threshold]);

  const handleWheelEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    setIsPulling(false);
    startY.current = 0;
  }, [isPulling, pullDistance, threshold, onRefresh, isRefreshing]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousemove', handleWheelMove, { passive: false });
    container.addEventListener('mouseup', handleWheelEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousemove', handleWheelMove);
      container.removeEventListener('mouseup', handleWheelEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel, handleWheelMove, handleWheelEnd]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 20;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10"
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 20)}px)`,
          opacity: showIndicator ? 1 : 0
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-3 flex items-center gap-2">
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : 0,
              scale: pullProgress
            }}
            transition={{
              rotate: { repeat: isRefreshing ? Infinity : 0, duration: 1 },
              scale: { type: 'spring', stiffness: 300, damping: 30 }
            }}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'text-green-500' : 'text-gray-500'}`} />
          </motion.div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </motion.div>

      {/* Content with pull resistance */}
      <motion.div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
