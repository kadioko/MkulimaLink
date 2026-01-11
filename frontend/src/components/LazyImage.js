import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

const LazyImage = ({
  src,
  alt,
  className = '',
  placeholder = 'blur',
  blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  webpSrc,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(false);
  };

  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc) return '';
    
    // If it's already a data URL, return as is
    if (originalSrc.startsWith('data:')) return originalSrc;
    
    // Add optimization parameters for external images
    if (originalSrc.includes('unsplash.com') || originalSrc.includes('cloudinary.com')) {
      return `${originalSrc}?w=800&h=600&fit=crop&auto=format`;
    }
    
    return originalSrc;
  };

  const renderPlaceholder = () => {
    if (placeholder === 'blur' && blurDataURL) {
      return (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          aria-hidden="true"
        />
      );
    }

    if (placeholder === 'skeleton') {
      return (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      );
    }

    if (placeholder === 'icon') {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
        </div>
      );
    }

    return null;
  };

  const renderErrorState = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
      <ImageIcon className="w-8 h-8 mb-2" />
      <span className="text-sm">Image not available</span>
    </div>
  );

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} {...props}>
      {renderPlaceholder()}
      
      {isInView && !error && (
        <picture>
          {webpSrc && (
            <source
              srcSet={getOptimizedSrc(webpSrc)}
              type="image/webp"
            />
          )}
          <img
            src={getOptimizedSrc(src)}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </picture>
      )}
      
      {error && renderErrorState()}
      
      {/* Loading indicator */}
      {isInView && !isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-green-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// Product image wrapper with aspect ratio
export const ProductImage = ({ src, alt, className = '', aspectRatio = 'aspect-square' }) => (
  <div className={`relative ${aspectRatio} ${className}`}>
    <LazyImage
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full rounded-lg"
      placeholder="skeleton"
    />
  </div>
);

// Avatar image wrapper
export const AvatarImage = ({ src, alt, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <LazyImage
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full rounded-full object-cover"
        placeholder="icon"
      />
    </div>
  );
};

// Gallery image with zoom capability
export const GalleryImage = ({ src, alt, onClick, className = '' }) => (
  <div 
    className={`relative cursor-pointer group ${className}`}
    onClick={onClick}
  >
    <LazyImage
      src={src}
      alt={alt}
      className="w-full h-full object-cover rounded-lg"
      placeholder="blur"
    />
    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
      <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  </div>
);

export default LazyImage;
