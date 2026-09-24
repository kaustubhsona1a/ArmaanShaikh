import React, { useState, useEffect, useRef } from 'react';
import { resolveImageUrl, getCachedBlobUrl, getInMemoryImageUrl, isCacheableUrl } from '../lib/imageCache';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  cacheLocally?: boolean;
}

export const VEHICLE_PLACEHOLDER_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500' fill='none'><rect width='800' height='500' fill='%23121214'/><path d='M250 280 L320 200 L480 200 L550 280 Z' stroke='%23ffffff' stroke-width='4' stroke-linejoin='round' opacity='0.25'/><circle cx='320' cy='310' r='35' stroke='%23ffffff' stroke-width='4' opacity='0.25'/><circle cx='480' cy='310' r='35' stroke='%23ffffff' stroke-width='4' opacity='0.25'/><text x='50%' y='68%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' opacity='0.3' font-family='sans-serif' font-size='14' letter-spacing='2'>PHOTO PENDING</text></svg>";

/**
 * Generates an alternative mirror URL between Cloudflare R2 CDN and Supabase Storage.
 * If Cloudflare R2 returns a 404/network error, automatically falls back to Supabase.
 * If Supabase returns an error, automatically falls back to Cloudflare R2 CDN.
 */
export function getAlternativeMirrorUrl(failedUrl: string, originalSrc?: string): string | null {
  if (!failedUrl) return null;

  // 1. If original un-resolved src is different from failed URL and is an absolute URL, try original
  if (originalSrc && originalSrc !== failedUrl && originalSrc.startsWith('http')) {
    return originalSrc;
  }

  // 2. Cloudflare R2 CDN -> Supabase Storage fallback
  if (failedUrl.includes('pub-f4e7a3fade6e4cc59414305e0c001271.r2.dev')) {
    if (failedUrl.includes('/vehicles/')) {
      const key = failedUrl.split('/vehicles/')[1];
      return `https://pgffljamplkthmwahmvn.supabase.co/storage/v1/object/public/vehicle-images/vehicles/${key}`;
    }
    if (failedUrl.includes('/site_settings/')) {
      const key = failedUrl.split('/site_settings/')[1];
      return `https://pgffljamplkthmwahmvn.supabase.co/storage/v1/object/public/site_settings/${key}`;
    }
    const relativeKey = failedUrl.replace('https://pub-f4e7a3fade6e4cc59414305e0c001271.r2.dev/', '');
    return `https://pgffljamplkthmwahmvn.supabase.co/storage/v1/object/public/vehicle-images/${relativeKey}`;
  }

  // 3. Supabase Storage -> Cloudflare R2 CDN fallback
  if (failedUrl.includes('supabase.co/storage/v1/object/public/vehicle-images/')) {
    return failedUrl.replace(
      /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/vehicle-images\//g,
      'https://pub-f4e7a3fade6e4cc59414305e0c001271.r2.dev/'
    );
  }

  if (failedUrl.includes('supabase.co/storage/v1/object/public/site_settings/')) {
    return failedUrl.replace(
      /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/site_settings\//g,
      'https://pub-f4e7a3fade6e4cc59414305e0c001271.r2.dev/site_settings/'
    );
  }

  return null;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  fallbackSrc = VEHICLE_PLACEHOLDER_FALLBACK,
  alt = 'Bombay Motors Showroom',
  className = '',
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...props
}) => {
  const resolved = resolveImageUrl(src);
  const inMemory = getInMemoryImageUrl(resolved);
  
  const [currentSrc, setCurrentSrc] = useState<string>(inMemory || resolved || fallbackSrc);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [hasTriedAlternative, setHasTriedAlternative] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(loading === 'eager');
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset fallback retry status on src change
  useEffect(() => {
    setHasTriedAlternative(false);
    setIsFailed(false);
  }, [src]);

  // Lazy viewport observer to ensure images offscreen are never fetched prematurely
  useEffect(() => {
    if (loading === 'eager' || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px 0px', threshold: 0.01 }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [loading]);

  // Handle caching and source updates when in view
  useEffect(() => {
    const nextResolved = resolveImageUrl(src);
    if (!nextResolved) {
      setCurrentSrc(fallbackSrc);
      return;
    }

    // 1. Instant in-memory check (0ms)
    const cached = getInMemoryImageUrl(nextResolved);
    if (cached) {
      setCurrentSrc(cached);
      setIsFailed(false);
      return;
    }

    let isMounted = true;

    // 2. Check persistent IndexedDB before network to guarantee 0 bytes on repeat visits
    if (isCacheableUrl(nextResolved)) {
      getCachedBlobUrl(nextResolved)
        .then((blobUrl) => {
          if (!isMounted) return;
          if (blobUrl) {
            setCurrentSrc(blobUrl);
            setIsFailed(false);
          } else {
            // Not in local storage: set network source directly
            // Native HTTP disk cache (Cache-Control: public, max-age=31536000) stores it without duplicate fetches
            setCurrentSrc(nextResolved);
            setIsFailed(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setCurrentSrc(nextResolved);
            setIsFailed(false);
          }
        });
    } else {
      setCurrentSrc(nextResolved);
      setIsFailed(false);
    }

    return () => {
      isMounted = false;
    };
  }, [src, fallbackSrc, isInView]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Attempt automatic fallback to alternative mirror (R2 <-> Supabase Storage)
    if (!hasTriedAlternative) {
      const mirror = getAlternativeMirrorUrl(currentSrc, src);
      if (mirror && mirror !== currentSrc) {
        setHasTriedAlternative(true);
        setCurrentSrc(mirror);
        return;
      }
    }

    if (!isFailed) {
      setIsFailed(true);
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
      }
    }
    if (onError) {
      onError(e);
    }
  };

  if (!currentSrc && !isInView) {
    return <div ref={imgRef} className={className} />;
  }

  return (
    <img
      ref={imgRef}
      src={isInView ? currentSrc : (inMemory || fallbackSrc)}
      alt={alt}
      loading={loading}
      decoding={decoding}
      referrerPolicy="no-referrer"
      className={className}
      onError={handleError}
      {...props}
    />
  );
};




