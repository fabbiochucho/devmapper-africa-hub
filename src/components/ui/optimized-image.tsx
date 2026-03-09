import React, { memo, useState, useCallback, useEffect, useRef, ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Primary image source */
  src: string;
  /** WebP format source (optional - auto-generated path if not provided) */
  webpSrc?: string;
  /** Responsive image srcset (e.g., "image-320.jpg 320w, image-640.jpg 640w") */
  srcSet?: string;
  /** Image sizes attribute for responsive loading */
  sizes?: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Whether to lazy load the image (default: true) */
  lazy?: boolean;
  /** Fallback element while loading */
  fallback?: React.ReactNode;
  /** Priority loading (for above-the-fold images) */
  priority?: boolean;
  /** Aspect ratio for placeholder (e.g., "16/9") */
  aspectRatio?: string;
}

/**
 * Optimized image component with:
 * - WebP format with fallback
 * - srcset/sizes for responsive images
 * - Lazy loading with IntersectionObserver
 * - Loading placeholder with aspect ratio preservation
 * - Error fallback
 */
export const OptimizedImage = memo(({
  src,
  webpSrc,
  srcSet,
  sizes,
  alt,
  lazy = true,
  fallback,
  priority = false,
  aspectRatio,
  className = '',
  ...props
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    if (!lazy || priority || inView) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before visible
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, inView]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  // Generate WebP path if not provided
  const webpPath = webpSrc || (src.match(/\.(jpg|jpeg|png)$/i) 
    ? src.replace(/\.(jpg|jpeg|png)$/i, '.webp') 
    : undefined);

  if (error) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div 
        className={`img-placeholder flex items-center justify-center text-muted-foreground text-sm ${className}`}
        style={aspectRatio ? { aspectRatio } : undefined}
        role="img"
        aria-label={alt}
      >
        {alt}
      </div>
    );
  }

  return (
    <picture>
      {/* WebP source for modern browsers */}
      {webpPath && inView && (
        <source srcSet={webpPath} type="image/webp" />
      )}
      {/* Responsive srcset */}
      {srcSet && inView && (
        <source srcSet={srcSet} sizes={sizes} />
      )}
      {/* Fallback img */}
      <img
        ref={imgRef}
        src={inView ? src : undefined}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleError}
        className={`${lazy ? (loaded ? 'lazy-image loaded' : 'lazy-image') : ''} ${className}`}
        style={aspectRatio ? { aspectRatio } : undefined}
        {...props}
      />
    </picture>
  );
});

OptimizedImage.displayName = 'OptimizedImage';
