import React, { useState, useEffect } from 'react';
import { resolveImageUrl } from '../lib/imageCache';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  cacheLocally?: boolean;
}

export const VEHICLE_PLACEHOLDER_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500' fill='none'><rect width='800' height='500' fill='%23121214'/><path d='M250 280 L320 200 L480 200 L550 280 Z' stroke='%23ffffff' stroke-width='4' stroke-linejoin='round' opacity='0.25'/><circle cx='320' cy='310' r='35' stroke='%23ffffff' stroke-width='4' opacity='0.25'/><circle cx='480' cy='310' r='35' stroke='%23ffffff' stroke-width='4' opacity='0.25'/><text x='50%' y='68%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' opacity='0.3' font-family='sans-serif' font-size='14' letter-spacing='2'>PHOTO PENDING</text></svg>";

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
  const [currentSrc, setCurrentSrc] = useState<string>(resolved || fallbackSrc);
  const [isFailed, setIsFailed] = useState<boolean>(false);

  useEffect(() => {
    const nextResolved = resolveImageUrl(src);
    if (nextResolved) {
      setCurrentSrc(nextResolved);
      setIsFailed(false);
    } else {
      setCurrentSrc(fallbackSrc);
    }
  }, [src, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
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

  if (!currentSrc) {
    return null;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      className={className}
      onError={handleError}
      {...props}
    />
  );
};




