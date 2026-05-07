import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const PriceRangeSlider = ({
  min = 0,
  max = 100000,
  value,
  onChange,
  step = 1000,
  currency = 'TZS',
  formatValue = (v) => v.toLocaleString(),
}) => {
  const [localValue, setLocalValue] = useState(value || [min, max]);
  const [isDragging, setIsDragging] = useState(null);
  const trackRef = useRef(null);

  // Sync with external value
  useEffect(() => {
    if (value) {
      setLocalValue(prev => {
        if (prev[0] !== value[0] || prev[1] !== value[1]) {
          return value;
        }
        return prev;
      });
    }
  }, [value]);

  const getPercentage = useCallback((val) => {
    return ((val - min) / (max - min)) * 100;
  }, [min, max]);

  const getValueFromPercentage = useCallback((percentage) => {
    const rawValue = (percentage / 100) * (max - min) + min;
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  const handleTrackClick = (e) => {
    if (!trackRef.current || isDragging) return;

    const rect = trackRef.current.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    const newValue = getValueFromPercentage(percentage);

    // Move the closest handle
    const distToMin = Math.abs(newValue - localValue[0]);
    const distToMax = Math.abs(newValue - localValue[1]);

    if (distToMin < distToMax) {
      const clampedValue = Math.min(newValue, localValue[1] - step);
      setLocalValue([clampedValue, localValue[1]]);
      onChange?.([clampedValue, localValue[1]]);
    } else {
      const clampedValue = Math.max(newValue, localValue[0] + step);
      setLocalValue([localValue[0], clampedValue]);
      onChange?.([localValue[0], clampedValue]);
    }
  };

  const handleMouseDown = (index) => (e) => {
    e.preventDefault();
    setIsDragging(index);
  };

  useEffect(() => {
    if (isDragging === null) return;

    const handleMouseMove = (e) => {
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const newValue = getValueFromPercentage(percentage);

      setLocalValue((prev) => {
        let newValues = [...prev];
        
        if (isDragging === 0) {
          newValues[0] = Math.min(newValue, prev[1] - step);
        } else {
          newValues[1] = Math.max(newValue, prev[0] + step);
        }
        
        onChange?.(newValues);
        return newValues;
      });
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, step, onChange, getValueFromPercentage]);

  const minPercent = getPercentage(localValue[0]);
  const maxPercent = getPercentage(localValue[1]);

  return (
    <div className="w-full">
      {/* Inputs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">{currency}</span>
          <input
            type="number"
            value={localValue[0]}
            onChange={(e) => {
              const val = Math.max(min, Math.min(parseInt(e.target.value) || 0, localValue[1] - step));
              setLocalValue([val, localValue[1]]);
              onChange?.([val, localValue[1]]);
            }}
            className="w-20 bg-transparent font-semibold text-gray-900 dark:text-white focus:outline-none"
          />
        </div>
        <span className="text-gray-400">—</span>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">{currency}</span>
          <input
            type="number"
            value={localValue[1]}
            onChange={(e) => {
              const val = Math.min(max, Math.max(parseInt(e.target.value) || 0, localValue[0] + step));
              setLocalValue([localValue[0], val]);
              onChange?.([localValue[0], val]);
            }}
            className="w-20 bg-transparent font-semibold text-gray-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Slider */}
      <div
        ref={trackRef}
        className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
        onClick={handleTrackClick}
      >
        {/* Active track */}
        <motion.div
          className="absolute h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
          layoutId="activeTrack"
        />

        {/* Min handle */}
        <motion.div
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-800 border-2 border-green-500 rounded-full shadow-md cursor-grab active:cursor-grabbing z-10 ${
            isDragging === 0 ? 'scale-110' : ''
          }`}
          style={{ left: `calc(${minPercent}% - 10px)` }}
          onMouseDown={handleMouseDown(0)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 1.2 }}
        />

        {/* Max handle */}
        <motion.div
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-800 border-2 border-green-500 rounded-full shadow-md cursor-grab active:cursor-grabbing z-10 ${
            isDragging === 1 ? 'scale-110' : ''
          }`}
          style={{ left: `calc(${maxPercent}% - 10px)` }}
          onMouseDown={handleMouseDown(1)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 1.2 }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};

export default PriceRangeSlider;
