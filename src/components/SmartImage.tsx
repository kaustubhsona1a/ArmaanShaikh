import React, { useState, useEffect } from 'react';
import { getCachedImageUrl, isCacheableUrl, getInMemoryImageUrl, resolveImageUrl } from '../lib/imageCache';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  cacheLocally?: boolean;
}

export const VEHICLE_PLACEHOLDER_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500' fill='none'><rect width='800' height='500' fill='%23121214'/><path d='M250 280 L320 200 L480 200 L550 280 Z' stroke='%23ffffff' stroke-width='4' stroke-linejoin='round' opacity='0.25'/><circle cx='320' cy='310' r='35' stroke='%23ffffff' stroke-width='4' opacity='0.25'/><circle cx='480' cy='310' r='35' stroke='%23ffffff' stroke-width='4' opacity='0.25'/><text x='50%' y='68%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' opacity='0.3' font-family='sans-serif' font-size='14' letter-spacing='2'>PHOTO PENDING</text></svg>";

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  fallbackSrc,
  alt = 'Bombay Motors Showroom',
  className = '',
  cacheLocally = true,
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...props
}) => {
  const resolved = resolveImageUrl(src);
  const initialSrc = resolved || fallbackSrc || '';
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [hasError, setHasError] = useState<boolean>(false);

  // Sync state when src or fallbackSrc prop updates
  useEffect(() => {
    const nextResolved = resolveImageUrl(src);
    if (!nextResolved) {
      setCurrentSrc(fallbackSrc || '');
      setHasError(false);
      return;
    }

    setHasError(false);
    const inMem = getInMemoryImageUrl(nextResolved);
    if (inMem) {
      setCurrentSrc(inMem);
      return;
    }

    // Direct local static assets (/logo.png, /hero-laptop.png, data:, blob:)
    const isDirect = nextResolved.startsWith('/') || nextResolved.startsWith('data:') || nextResolved.startsWith('blob:');
    if (isDirect) {
      setCurrentSrc(nextResolved);
      return;
    }

    // Remote URL: set immediately for instant paint via browser cache, and background-cache to IndexedDB
    setCurrentSrc(nextResolved);

    if (cacheLocally && isCacheableUrl(nextResolved)) {
      let isMounted = true;
      getCachedImageUrl(nextResolved)
        .then((cachedBlobUrl) => {
          if (isMounted && cachedBlobUrl && cachedBlobUrl !== nextResolved) {
            setCurrentSrc(cachedBlobUrl);
          }
        })
        .catch(() => {
          // Keep current direct URL
        });

      return () => {
        isMounted = false;
      };
    }
  }, [src, fallbackSrc, cacheLocally]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
      }
    }
    if (onError) {
      onError(e);
    }
  };

  if (!currentSrc) {
    return null;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={className}
      onError={handleError}
      {...props}
    />
  );
};



