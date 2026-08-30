import React, { useState, useEffect, useRef } from 'react';
import { getCachedImageUrl, isCacheableUrl, getInMemoryImageUrl } from '../lib/imageCache';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  cacheLocally?: boolean;
}

const TRANSPARENT_PIXEL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
const DEFAULT_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500' fill='none'><rect width='800' height='500' fill='%23121214'/><path d='M250 280 L320 200 L480 200 L550 280 Z' stroke='%23ffffff' stroke-width='4' stroke-linejoin='round' opacity='0.25'/><circle cx='320' cy='310' r='35' stroke='%23ffffff' stroke-width='4' opacity='0.25'/><circle cx='480' cy='310' r='35' stroke='%23ffffff' stroke-width='4' opacity='0.25'/><text x='50%' y='68%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' opacity='0.3' font-family='sans-serif' font-size='14' letter-spacing='2'>PHOTO PENDING</text></svg>";

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
  const isDirect = !src || src.startsWith('data:') || src.startsWith('blob:');
  
  // Strict on-demand viewport gating: only mount image source when scrolled into view (or if explicitly eager)
  const [isInView, setIsInView] = useState<boolean>(loading === 'eager');
  const [currentSrc, setCurrentSrc] = useState<string>(
    inMem ? inMem : (loading === 'eager' && isDirect ? (src || fallbackSrc) : TRANSPARENT_PIXEL)
  );
  const [isLoaded, setIsLoaded] = useState<boolean>(!!inMem);
  const [hasError, setHasError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Viewport Intersection Observer: Only trigger fetch/cache when viewer reaches the element
  useEffect(() => {
    if (loading === 'eager' || isInView) {
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
      { rootMargin: '30px 0px' } // Strictly triggers only when the viewer scrolls right up to the image
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, isInView]);

  // Load from IndexedDB / Memory Cache / Network only once in view
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

