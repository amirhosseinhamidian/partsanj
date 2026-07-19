'use client';

import { Button } from '@/components/ui/button';
import { FileUpload, type FileUploadRejection } from '@/components/ui/file-upload';
import { ImageUrlPreview } from '@/components/ui/image-url-preview';
import { Input } from '@/components/ui/input';
import type { AdminUploadedImage, AdminUploadPurpose } from '@/lib/admin/uploads/upload.types';
import { adminUploadsApi } from '@/lib/api/admin-uploads-client';
import { Trash2 } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type AdminSingleImageUploadFieldProps = {
  purpose: AdminUploadPurpose;

  value: string;
  onChange: (url: string) => void;

  alt: string;

  disabled?: boolean;
  inputId?: string;
  inputPlaceholder?: string;

  uploadTitle?: string;
  uploadDescription?: string;

  previewClassName?: string;
  previewImageClassName?: string;

  allowManualUrl?: boolean;

  onUploaded?: (uploadedImage: AdminUploadedImage) => void;

  onUploadingChange?: (isUploading: boolean) => void;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'آپلود تصویر با خطا مواجه شد';
}

export function AdminSingleImageUploadField({
  purpose,
  value,
  onChange,
  alt,
  disabled = false,
  inputId,
  inputPlaceholder = 'https://partsanj.ir/uploads/...',
  uploadTitle = 'آپلود تصویر',
  uploadDescription = 'تصویر JPEG، PNG یا WebP را انتخاب کنید',
  previewClassName = 'aspect-video w-full',
  previewImageClassName,
  allowManualUrl = true,
  onUploaded,
  onUploadingChange,
}: AdminSingleImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const normalizedValue = value.trim();

  function handleUrlChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
    setUploadError(null);
  }

  function handleRejectedFiles(rejections: FileUploadRejection[]) {
    setUploadError(rejections[0]?.message ?? 'فایل انتخاب‌شده معتبر نیست');
  }

  async function handleFilesSelected(files: File[]): Promise<void> {
    const file = files[0];

    if (!file) {
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    onUploadingChange?.(true);

    try {
      const response = await adminUploadsApi.uploadImage(file, purpose);

      onChange(response.data.url);
      onUploaded?.(response.data);
    } catch (error) {
      const message = getErrorMessage(error);

      setUploadError(message);

      /*
       * FileUpload خطای Promise را نیز داخل خودش
       * نمایش می‌دهد.
       */
      throw new Error(message);
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  }

  return (
    <div className='space-y-4'>
      {allowManualUrl ? (
        <Input
          id={inputId}
          type='url'
          dir='ltr'
          inputMode='url'
          maxLength={2048}
          disabled={disabled || isUploading}
          value={value}
          onChange={handleUrlChange}
          onBlur={() => {
            onChange(value.trim());
          }}
          placeholder={inputPlaceholder}
        />
      ) : null}

      <FileUpload
        accept='image/jpeg,image/png,image/webp'
        multiple={false}
        maxFiles={1}
        maxSize={MAX_IMAGE_SIZE_BYTES}
        disabled={disabled || isUploading}
        title={normalizedValue ? 'جایگزینی تصویر' : uploadTitle}
        description={uploadDescription}
        onFilesSelected={handleFilesSelected}
        onFilesRejected={handleRejectedFiles}
      />

      {uploadError ? (
        <p role='alert' className='text-sm font-medium text-danger'>
          {uploadError}
        </p>
      ) : null}

      <ImageUrlPreview
        src={normalizedValue}
        alt={alt}
        className={previewClassName}
        imageClassName={previewImageClassName}
      />

      {normalizedValue ? (
        <Button
          type='button'
          variant='danger'
          size='sm'
          disabled={disabled || isUploading}
          iconStart={<Trash2 />}
          onClick={() => {
            onChange('');
            setUploadError(null);
          }}
        >
          حذف تصویر از فرم
        </Button>
      ) : null}
    </div>
  );
}
