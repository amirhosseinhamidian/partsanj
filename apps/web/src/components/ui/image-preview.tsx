'use client';

/* eslint-disable @next/next/no-img-element */

import { cn } from '@/lib/utils/cn';
import { ImageOff } from 'lucide-react';
import { useEffect, useState, type HTMLAttributes } from 'react';

export type ImagePreviewProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  src?: string | null;
  alt?: string;
  imageClassName?: string;
  fallbackLabel?: string;
};

export function ImagePreview({
  src,
  alt = 'تصویر محصول',
  fallbackLabel = 'تصویر قابل نمایش نیست',
  className,
  imageClassName,
  ...props
}: ImagePreviewProps) {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [src]);

  const canRenderImage = Boolean(src?.trim()) && !hasImageError;

  return (
    <div
      {...props}
      className={cn(
        'relative overflow-hidden rounded-control border border-border bg-surface-muted',
        className,
      )}
    >
      {canRenderImage ? (
        <img
          src={src ?? ''}
          alt={alt}
          loading='lazy'
          onError={() => setHasImageError(true)}
          className={cn('size-full object-cover', imageClassName)}
        />
      ) : (
        <div className='flex size-full flex-col items-center justify-center gap-2 px-3 text-center text-foreground-muted'>
          <ImageOff className='size-5' />

          <span className='text-xs leading-5'>{fallbackLabel}</span>
        </div>
      )}
    </div>
  );
}
