import React, { useState, useEffect, useRef } from 'react';
import { getCachedImageUrl, isCacheableUrl, getInMemoryImageUrl } from '../lib/imageCache';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  cacheLocally?: boolean;
}

const TRANSPARENT_PIXEL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800";

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt = 'Bombay Motors Showroom',
  className = '',
  cacheLocally = true,
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...props
}) => {
  const inMem = getInMemoryImageUrl(src);
  // Only use raw src directly if it is an SVG, local blob, data-uri, or non-cacheable
  const isDirect = !src || src.startsWith('data:') || src.startsWith('blob:') || !cacheLocally || !isCacheableUrl(src);
  
  const [currentSrc, setCurrentSrc] = useState<string>(
    inMem ? inMem : (isDirect ? (src || fallbackSrc) : (loading === 'eager' ? (src || fallbackSrc) : TRANSPARENT_PIXEL))
  );
  const [isLoaded, setIsLoaded] = useState<boolean>(!!inMem);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);

  // Viewport Intersection Observer: Only trigger fetch/cache when within 150px of viewport
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true);
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' } // Pre-load smoothly 200px before scrolling into view
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  // Load from IndexedDB / Memory Cache
  useEffect(() => {
    if (!src || !isInView) return;

    let isMounted = true;
    setHasError(false);

    // 1. Check in-memory sync cache
    const memUrl = getInMemoryImageUrl(src);
    if (memUrl) {
      setCurrentSrc(memUrl);
      setIsLoaded(true);
      return;
    }

    // 2. Fetch from IndexedDB / CacheStorage / Single Network Fetch
    if (cacheLocally && isCacheableUrl(src)) {
      getCachedImageUrl(src)
        .then((resolvedUrl) => {
          if (isMounted) {
            setCurrentSrc(resolvedUrl);
            setIsLoaded(true);
          }
        })
        .catch(() => {
          if (isMounted) {
            setCurrentSrc(src);
            setIsLoaded(true);
          }
        });
    } else {
      setCurrentSrc(src);
      setIsLoaded(true);
    }

    return () => {
      isMounted = false;
    };
  }, [src, isInView, cacheLocally]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
    if (onError) {
      onError(e);
    }
  };

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={`${className} ${!isLoaded && currentSrc === TRANSPARENT_PIXEL ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      onError={handleError}
      {...props}
    />
  );
};

