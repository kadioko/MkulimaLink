import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const OptimizedImage = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  width,
  height,
  placeholder = 'blur',
  blurDataUrl,
  priority = false,
  objectFit = 'cover',
  onLoad,
  onError,
  fallback = '/images/placeholder.png',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imageRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imageRef.current) {
      observerRef.current.observe(imageRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = hasError ? fallback : src;

  return (
    <div
      ref={imageRef}
      className={`relative overflow-hidden ${containerClassName}`}
      style={{ width, height }}
    >
      {/* Placeholder / Blur effect */}
      {!isLoaded && placeholder === 'blur' && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isLoaded ? 0 : 1 }}
          className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300"
          style={{
            backgroundImage: blurDataUrl ? `url(${blurDataUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: blurDataUrl ? 'blur(20px)' : undefined,
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </motion.div>
      )}

      {/* Color placeholder */}
      {!isLoaded && placeholder === 'color' && (
        <div className="absolute inset-0 bg-gray-200" />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <span className="text-4xl">🖼️</span>
        </div>
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <motion.img
          src={imageSrc}
          alt={alt}
          className={`${className} ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
          style={{ width: '100%', height: '100%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
        />
      )}
    </div>
  );
};

// Hook for generating blur data URL (can be used server-side or at build time)
export const generateBlurDataUrl = async (imageSrc, width = 8) => {
  // This is a placeholder - in production you'd use a library like plaiceholder
  // or generate these at build time
  return `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
    </svg>
  `)}`;
};

// Responsive image component with srcset
export const ResponsiveImage = ({
  src,
  alt,
  sizes = '100vw',
  className = '',
  ...props
}) => {
  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc) => {
    if (!baseSrc) return '';
    const widths = [320, 640, 960, 1280, 1920];
    return widths
      .map(w => `${baseSrc}?w=${w} ${w}w`)
      .join(', ');
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      srcSet={generateSrcSet(src)}
      sizes={sizes}
      {...props}
    />
  );
};

export default OptimizedImage;
