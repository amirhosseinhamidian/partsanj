'use client';

import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/icon-button';
import { ImagePreview } from '@/components/ui/image-preview';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

export type SortableImageStatus = 'ready' | 'uploading' | 'error';

export type SortableImageItem = {
  id: string;
  url: string;
  alt: string;
  status?: SortableImageStatus;
  error?: string;
};

export type SortableImageListProps = {
  items: SortableImageItem[];

  onReorder: (items: SortableImageItem[]) => void;
  onRemove: (id: string) => void;

  onAltChange?: (id: string, alt: string) => void;

  onUrlChange?: (id: string, url: string) => void;

  disabled?: boolean;
  showUrlInput?: boolean;
  showAltInput?: boolean;

  emptyState?: ReactNode;
  className?: string;
};

type SortableImageCardProps = {
  item: SortableImageItem;
  index: number;
  totalItems: number;

  disabled: boolean;
  showUrlInput: boolean;
  showAltInput: boolean;

  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onAltChange?: (id: string, alt: string) => void;
  onUrlChange?: (id: string, url: string) => void;
};

function ImageStatusBadge({ item }: { item: SortableImageItem }) {
  if (item.status === 'uploading') {
    return (
      <Badge size='sm' variant='warning'>
        در حال بارگذاری
      </Badge>
    );
  }

  if (item.status === 'error') {
    return (
      <Badge size='sm' variant='danger'>
        خطا
      </Badge>
    );
  }

  return null;
}

function SortableImageCard({
  item,
  index,
  totalItems,
  disabled,
  showUrlInput,
  showAltInput,
  onMove,
  onRemove,
  onAltChange,
  onUrlChange,
}: SortableImageCardProps) {
  const itemDisabled = disabled || item.status === 'uploading';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: itemDisabled,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative grid gap-3 rounded-card border border-border bg-surface p-3 shadow-sm transition-shadow sm:grid-cols-[7.5rem_minmax(0,1fr)]',
        isDragging && 'z-10 border-brand shadow-floating',
      )}
    >
      <div className='relative'>
        <ImagePreview
          src={item.url}
          alt={item.alt || `تصویر محصول شماره ${index + 1}`}
          className='aspect-square w-full'
        />

        <div className='absolute inset-s-2 top-2 flex gap-1.5'>
          {index === 0 ? (
            <Badge size='sm' variant='brand'>
              تصویر اصلی
            </Badge>
          ) : null}

          <ImageStatusBadge item={item} />
        </div>
      </div>

      <div className='min-w-0 space-y-3'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-2'>
            <button
              type='button'
              aria-label={`جابجایی تصویر شماره ${index + 1}`}
              disabled={itemDisabled}
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-[10px] border border-border bg-surface-muted text-foreground-muted transition-colors',
                'hover:border-border-strong hover:text-foreground focus:ring-2 focus:ring-focus-ring focus:outline-none',
                itemDisabled && 'cursor-not-allowed opacity-50',
              )}
              {...attributes}
              {...listeners}
            >
              <GripVertical className='size-4' />
            </button>

            <p className='truncate text-sm font-bold text-foreground'>تصویر {index + 1}</p>
          </div>

          <div className='flex items-center gap-1'>
            <IconButton
              type='button'
              aria-label={`انتقال تصویر شماره ${index + 1} به بالا`}
              icon={<ChevronUp />}
              variant='ghost'
              size='sm'
              disabled={itemDisabled || index === 0}
              onClick={() => onMove(item.id, -1)}
            />

            <IconButton
              type='button'
              aria-label={`انتقال تصویر شماره ${index + 1} به پایین`}
              icon={<ChevronDown />}
              variant='ghost'
              size='sm'
              disabled={itemDisabled || index === totalItems - 1}
              onClick={() => onMove(item.id, 1)}
            />

            <IconButton
              type='button'
              aria-label={`حذف تصویر شماره ${index + 1}`}
              icon={<Trash2 />}
              variant='danger'
              size='sm'
              disabled={itemDisabled}
              onClick={() => onRemove(item.id)}
            />
          </div>
        </div>

        {showUrlInput && onUrlChange ? (
          <Input
            aria-label={`آدرس تصویر شماره ${index + 1}`}
            dir='ltr'
            type='url'
            disabled={itemDisabled}
            value={item.url}
            onChange={(event) => onUrlChange(item.id, event.target.value)}
            placeholder='https://cdn.example.com/product-image.jpg'
          />
        ) : null}

        {showAltInput && onAltChange ? (
          <Input
            aria-label={`متن جایگزین تصویر شماره ${index + 1}`}
            disabled={itemDisabled}
            value={item.alt}
            onChange={(event) => onAltChange(item.id, event.target.value)}
            placeholder='متن جایگزین تصویر'
          />
        ) : null}

        {item.error ? (
          <p role='alert' className='type-caption font-medium text-danger'>
            {item.error}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function SortableImageList({
  items,
  onReorder,
  onRemove,
  onAltChange,
  onUrlChange,
  disabled = false,
  showUrlInput = true,
  showAltInput = true,
  emptyState = 'هنوز تصویری ثبت نشده است',
  className,
}: SortableImageListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);

    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  function moveItem(id: string, direction: -1 | 1) {
    const oldIndex = items.findIndex((item) => item.id === id);

    const newIndex = oldIndex + direction;

    if (oldIndex < 0 || newIndex < 0 || newIndex >= items.length) {
      return;
    }

    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          'rounded-control border border-dashed border-border bg-surface-muted px-4 py-6 text-center text-sm text-foreground-muted',
          className,
        )}
      >
        {emptyState}
      </div>
    );
  }

  return (
    <div className={className}>
      <p className='mb-3 text-xs text-foreground-muted'>
        اولین تصویر به‌عنوان تصویر اصلی محصول نمایش داده می‌شود
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
          <ol className='space-y-3'>
            {items.map((item, index) => (
              <SortableImageCard
                key={item.id}
                item={item}
                index={index}
                totalItems={items.length}
                disabled={disabled}
                showUrlInput={showUrlInput}
                showAltInput={showAltInput}
                onMove={moveItem}
                onRemove={onRemove}
                onAltChange={onAltChange}
                onUrlChange={onUrlChange}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}
