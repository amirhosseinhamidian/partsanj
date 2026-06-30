'use client';

import { cn } from '@/lib/utils/cn';
import { FileImage, LoaderCircle, UploadCloud } from 'lucide-react';
import {
  useId,
  useRef,
  useState,
  type DragEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react';

export type FileUploadRejectionReason = 'invalid-type' | 'file-too-large' | 'too-many-files';

export type FileUploadRejection = {
  file: File;
  reason: FileUploadRejectionReason;
  message: string;
};

export type FileUploadProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'accept' | 'multiple' | 'size' | 'className'
> & {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;

  title?: string;
  description?: string;

  onFilesSelected: (files: File[]) => void | Promise<void>;
  onFilesRejected?: (rejections: FileUploadRejection[]) => void;

  className?: string;
  inputClassName?: string;
};

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} بایت`;
  }

  const units = ['KB', 'MB', 'GB'];
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept?.trim()) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return accept
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith('.')) {
        return fileName.endsWith(rule);
      }

      if (rule.endsWith('/*')) {
        return fileType.startsWith(rule.slice(0, -1));
      }

      return fileType === rule;
    });
}

export function FileUpload({
  id,
  accept = 'image/*',
  multiple = false,
  maxFiles = multiple ? 10 : 1,
  maxSize,
  disabled = false,
  title = 'فایل‌ها را اینجا رها کنید',
  description,
  onFilesSelected,
  onFilesRejected,
  className,
  inputClassName,
  ...inputProps
}: FileUploadProps) {
  const generatedId = useId();

  const inputId = id ?? `file-upload-${generatedId.replace(/:/g, '')}`;

  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const effectiveMaxFiles = multiple ? Math.max(maxFiles, 0) : 1;

  const isDisabled = disabled || isProcessing || effectiveMaxFiles === 0;

  async function processFiles(files: File[]) {
    if (isDisabled || files.length === 0) {
      return;
    }

    setInternalError(null);

    const acceptedFiles: File[] = [];
    const rejections: FileUploadRejection[] = [];

    for (const file of files) {
      if (!matchesAccept(file, accept)) {
        rejections.push({
          file,
          reason: 'invalid-type',
          message: `فرمت فایل «${file.name}» مجاز نیست`,
        });

        continue;
      }

      if (maxSize && file.size > maxSize) {
        rejections.push({
          file,
          reason: 'file-too-large',
          message: `حجم فایل «${file.name}» بیشتر از ${formatBytes(maxSize)} است`,
        });

        continue;
      }

      acceptedFiles.push(file);
    }

    const allowedFiles = acceptedFiles.slice(0, effectiveMaxFiles);

    if (acceptedFiles.length > effectiveMaxFiles) {
      acceptedFiles.slice(effectiveMaxFiles).forEach((file) => {
        rejections.push({
          file,
          reason: 'too-many-files',
          message: `حداکثر ${effectiveMaxFiles.toLocaleString('fa-IR')} فایل قابل انتخاب است`,
        });
      });
    }

    if (rejections.length > 0) {
      onFilesRejected?.(rejections);
    }

    if (allowedFiles.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      await onFilesSelected(allowedFiles);
    } catch (error) {
      setInternalError(
        error instanceof Error && error.message.trim()
          ? error.message
          : 'پردازش فایل‌ها با خطا مواجه شد',
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function openFileDialog() {
    if (!isDisabled) {
      inputRef.current?.click();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isDisabled) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFileDialog();
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (isDisabled) {
      return;
    }

    setIsDragging(false);

    void processFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <div className={cn('w-full', className)}>
      <input
        {...inputProps}
        ref={inputRef}
        id={inputId}
        type='file'
        accept={accept}
        multiple={multiple}
        disabled={isDisabled}
        className={cn('sr-only', inputClassName)}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);

          event.currentTarget.value = '';

          void processFiles(files);
        }}
      />

      <div
        role='button'
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        aria-describedby={inputProps['aria-describedby']}
        aria-invalid={inputProps['aria-invalid']}
        onClick={openFileDialog}
        onKeyDown={handleKeyDown}
        onDragEnter={(event) => {
          event.preventDefault();

          if (!isDisabled) {
            setIsDragging(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();

          if (!isDisabled) {
            event.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={cn(
          'group flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-card border border-dashed px-5 py-6 text-center transition-colors',
          'focus:ring-2 focus:ring-focus-ring focus:outline-none',
          isDragging
            ? 'border-brand bg-brand-soft'
            : 'border-border bg-surface-muted hover:border-border-strong hover:bg-surface',
          isDisabled && 'cursor-not-allowed opacity-55 hover:border-border hover:bg-surface-muted',
        )}
      >
        <span
          className={cn(
            'grid size-11 place-items-center rounded-control transition-colors',
            isDragging
              ? 'bg-brand text-brand-foreground'
              : 'bg-surface text-foreground-muted group-hover:text-brand',
          )}
        >
          {isProcessing ? (
            <LoaderCircle className='size-5 animate-spin' />
          ) : (
            <UploadCloud className='size-5' />
          )}
        </span>

        <p className='mt-3 text-sm font-bold text-foreground'>
          {isProcessing ? 'در حال پردازش فایل‌ها...' : title}
        </p>

        <p className='mt-1 text-xs leading-5 text-foreground-muted'>
          {description ?? 'برای انتخاب فایل کلیک کنید یا فایل را اینجا رها کنید'}
        </p>

        <div className='mt-3 flex items-center gap-1.5 text-xs text-foreground-muted'>
          <FileImage className='size-4' />

          <span>
            {multiple ? `حداکثر ${effectiveMaxFiles.toLocaleString('fa-IR')} فایل` : 'یک فایل'}
            {maxSize ? ` · حداکثر ${formatBytes(maxSize)}` : null}
          </span>
        </div>
      </div>

      {internalError ? (
        <p role='alert' className='type-caption mt-2 font-medium text-danger'>
          {internalError}
        </p>
      ) : null}
    </div>
  );
}
