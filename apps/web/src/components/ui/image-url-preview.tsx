'use client';

import { cn } from '@/lib/utils/cn';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const PRODUCT_PLACEHOLDER_SRC = '/images/product-placeholder.png';

type ImageUrlPreviewProps = {
  src?: string | null;
  alt: string;
  emptyLabel?: string;
  className?: string;
  imageClassName?: string;
};

export function ImageUrlPreview({
  src,
  alt,
  emptyLabel = 'تصویری ثبت نشده است',
  className,
  imageClassName,
}: ImageUrlPreviewProps) {
  const normalizedSrc = src?.trim() ?? '';

  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [normalizedSrc]);

  const shouldShowPlaceholder = !normalizedSrc || hasImageError;

  return (
    <div
      className={cn(
        'relative min-h-24 min-w-24 overflow-hidden rounded-control border border-border bg-surface-muted',
        className,
      )}
    >
      {shouldShowPlaceholder ? (
        <Image
          src={PRODUCT_PLACEHOLDER_SRC}
          alt={emptyLabel || 'تصویر محصول موجود نیست'}
          fill
          sizes='(max-width: 768px) 160px, 240px'
          className={cn('object-cover', imageClassName)}
        />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normalizedSrc}
            alt={alt}
            loading='lazy'
            className={cn('size-full object-cover', imageClassName)}
            onError={() => setHasImageError(true)}
          />
        </>
      )}
    </div>
  );
}
