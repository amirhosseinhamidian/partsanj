'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

type DropdownOptionImageProps = {
  src?: string | null;
  alt: string;
};

export function DropdownOptionImage({ src, alt }: DropdownOptionImageProps) {
  const [hasError, setHasError] = useState(false);

  const normalizedSrc = useMemo(() => {
    if (typeof src !== 'string') {
      return '';
    }

    return src.trim();
  }, [src]);

  if (!normalizedSrc || hasError) {
    return (
      <span
        aria-hidden='true'
        className='block size-8 shrink-0 rounded-md border border-border bg-surface-muted'
      />
    );
  }

  return (
    <span className='relative block size-8 shrink-0 overflow-hidden rounded-md border border-border bg-white'>
      <Image
        src={normalizedSrc}
        alt={alt}
        fill
        sizes='32px'
        className='object-cover'
        unoptimized
        onError={() => setHasError(true)}
      />
    </span>
  );
}
