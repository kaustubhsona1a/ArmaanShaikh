import React, { useState, useEffect } from 'react';
import { getCachedImageUrl, isCacheableUrl } from '../lib/imageCache';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  cacheLocally?: boolean;
}

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800";

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt = 'Vehicle Image',
  className = '',
  cacheLocally = true,
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setHasError(false);

    if (!src) {
      setCurrentSrc(fallbackSrc);
      return;
    }

    if (cacheLocally && isCacheableUrl(src)) {
      getCachedImageUrl(src)
        .then((resolvedUrl) => {
          if (isMounted) {
            setCurrentSrc(resolvedUrl);
          }
        })
        .catch(() => {
          if (isMounted) {
            setCurrentSrc(src);
          }
        });
    } else {
      setCurrentSrc(src);
    }

    return () => {
      isMounted = false;
    };
  }, [src, fallbackSrc, cacheLocally]);

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
