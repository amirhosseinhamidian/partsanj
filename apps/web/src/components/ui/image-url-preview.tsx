'use client';

import { cn } from '@/lib/utils/cn';
import { ImageOff } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

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

  if (!normalizedSrc || hasImageError) {
    return (
      <div
        role='img'
        aria-label={emptyLabel || 'تصویری ثبت نشده است'}
        className={cn(
          'flex min-h-24 min-w-24 items-center justify-center overflow-hidden rounded-control border border-dashed border-border bg-surface-muted text-foreground-muted',
          className,
        )}
      >
        <div className='flex flex-col items-center gap-1.5 px-3 text-center'>
          <ImageOff className='size-5' />

          {emptyLabel ? <span className='text-xs font-medium'>{emptyLabel}</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-24 min-w-24 overflow-hidden rounded-control border border-border bg-surface-muted',
        className,
      )}
    >
      <img
        src={normalizedSrc}
        alt={alt}
        loading='lazy'
        className={cn('size-full object-cover', imageClassName)}
        onError={() => setHasImageError(true)}
      />
    </div>
  );
}
