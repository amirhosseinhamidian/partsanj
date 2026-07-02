'use client';

import { ImageUrlPreview } from '@/components/ui/image-url-preview';
import type { StorefrontProductImage } from '@/lib/storefront/catalog/catalog.types';
import { cn } from '@/lib/utils/cn';
import { toPersianDigits } from '@/lib/utils/digits';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';

const SWIPE_THRESHOLD = 56;

type StorefrontProductImageGalleryProps = {
  images: StorefrontProductImage[];
  productName: string;
  className?: string;
};

export function StorefrontProductImageGallery({
  images,
  productName,
  className,
}: StorefrontProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pointerState = useRef<{
    pointerId: number;
    startX: number;
  } | null>(null);

  const imagesKey = useMemo(() => images.map((image) => image.id).join('|'), [images]);

  useEffect(() => {
    setActiveIndex(0);
    setDragOffset(0);
    setIsDragging(false);
  }, [imagesKey]);

  const hasMultipleImages = images.length > 1;

  const goToImage = useCallback(
    (nextIndex: number) => {
      setActiveIndex(() => {
        if (!images.length) {
          return 0;
        }

        return Math.max(0, Math.min(nextIndex, images.length - 1));
      });

      setDragOffset(0);
      setIsDragging(false);
    },
    [images.length],
  );

  function resetDrag() {
    pointerState.current = null;
    setDragOffset(0);
    setIsDragging(false);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!hasMultipleImages) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    pointerState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
    };

    setIsDragging(true);
    setDragOffset(0);

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const currentPointer = pointerState.current;

    if (!currentPointer || currentPointer.pointerId !== event.pointerId) {
      return;
    }

    setDragOffset(event.clientX - currentPointer.startX);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const currentPointer = pointerState.current;

    if (!currentPointer || currentPointer.pointerId !== event.pointerId) {
      return;
    }

    const distance = event.clientX - currentPointer.startX;
    const width = event.currentTarget.getBoundingClientRect().width;

    const dynamicThreshold = Math.max(SWIPE_THRESHOLD, width * 0.12);

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture ممکن است پیش‌تر آزاد شده باشد
    }

    resetDrag();

    if (Math.abs(distance) < dynamicThreshold) {
      return;
    }

    if (distance > 0) {
      goToImage(activeIndex + 1);
      return;
    }

    goToImage(activeIndex - 1);
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (pointerState.current?.pointerId !== event.pointerId) {
      return;
    }

    resetDrag();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!hasMultipleImages) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToImage(activeIndex + 1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToImage(activeIndex - 1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      goToImage(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      goToImage(images.length - 1);
    }
  }

  if (images.length === 0) {
    return (
      <ImageUrlPreview
        src={null}
        alt={`تصویر محصول ${productName}`}
        emptyLabel='تصویری برای این محصول ثبت نشده است'
        className={cn('aspect-square w-full rounded-card bg-surface', className)}
        imageClassName='object-contain p-4'
      />
    );
  }

  return (
    <section className={cn('w-full max-w-full min-w-0', className)} aria-label='گالری تصاویر محصول'>
      <div className='w-full max-w-full min-w-0 overflow-hidden rounded-card border border-border bg-surface'>
        <div
          role='region'
          aria-roledescription='carousel'
          aria-label={`تصاویر محصول ${productName}`}
          tabIndex={hasMultipleImages ? 0 : -1}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={cn(
            'relative aspect-square w-full max-w-full min-w-0 overflow-hidden outline-none',
            hasMultipleImages &&
              'cursor-grab touch-pan-y select-none focus-visible:ring-2 focus-visible:ring-focus-ring active:cursor-grabbing',
          )}
        >
          <div
            dir='ltr'
            className={cn(
              'flex h-full w-full min-w-0 flex-row-reverse',
              !isDragging && 'transition-transform duration-300 ease-out',
            )}
            style={{
              transform: `translate3d(calc(${activeIndex * 100}% + ${dragOffset}px), 0, 0)`,
            }}
          >
            {images.map((image, index) => (
              <div
                key={image.id}
                className='h-full min-w-0 shrink-0 basis-full'
                aria-hidden={index !== activeIndex}
              >
                <div className='pointer-events-none h-full w-full'>
                  <ImageUrlPreview
                    src={image.url}
                    alt={image.alt || `تصویر ${index + 1} محصول ${productName}`}
                    emptyLabel='تصویر قابل نمایش نیست'
                    className='h-full w-full rounded-none border-0 bg-surface'
                    imageClassName='object-contain p-4'
                  />
                </div>
              </div>
            ))}
          </div>

          {hasMultipleImages ? (
            <>
              <button
                type='button'
                aria-label='تصویر قبلی'
                disabled={activeIndex === 0}
                data-gallery-control
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  goToImage(activeIndex - 1);
                }}
                className='absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface/90 text-foreground shadow-panel backdrop-blur transition-colors hover:border-brand hover:bg-brand hover:text-brand-foreground disabled:pointer-events-none disabled:opacity-35'
              >
                <ChevronRight className='size-5' />
              </button>
              <button
                type='button'
                aria-label='تصویر بعدی'
                disabled={activeIndex === images.length - 1}
                data-gallery-control
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  goToImage(activeIndex + 1);
                }}
                className='absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface/90 text-foreground shadow-panel backdrop-blur transition-colors hover:border-brand hover:bg-brand hover:text-brand-foreground disabled:pointer-events-none disabled:opacity-35'
              >
                <ChevronLeft className='size-5' />
              </button>

              <div className='absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground/60 px-3 py-1.5 text-xs font-bold text-background backdrop-blur'>
                <span className='numeric'>{toPersianDigits(activeIndex + 1)}</span>

                <span>/</span>

                <span className='numeric'>{toPersianDigits(images.length)}</span>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {hasMultipleImages ? (
        <div className='mt-4 grid w-full min-w-0 grid-cols-4 gap-3 sm:grid-cols-5'>
          {images.map((image, index) => {
            const isSelected = index === activeIndex;

            return (
              <button
                key={image.id}
                type='button'
                aria-label={`نمایش تصویر ${index + 1}`}
                aria-pressed={isSelected}
                onClick={() => goToImage(index)}
                className={cn(
                  'overflow-hidden rounded-control border bg-surface transition-colors',
                  isSelected
                    ? 'border-brand ring-2 ring-brand/20'
                    : 'border-border hover:border-border-strong',
                )}
              >
                <ImageUrlPreview
                  src={image.url}
                  alt={image.alt || `تصویر ${index + 1} محصول ${productName}`}
                  emptyLabel=''
                  className='aspect-square w-full rounded-none border-0'
                  imageClassName='object-contain p-1'
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
