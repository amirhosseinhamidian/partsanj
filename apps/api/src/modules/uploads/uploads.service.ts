import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fileTypeFromBuffer } from 'file-type';
import { ALLOWED_IMAGE_MIME_TYPES, parseMaxImageBytes } from './upload.constants.js';
import {
  IMAGE_PROCESSOR,
  ImageProcessorError,
  type ImageProcessor,
  type ImageProcessorErrorCode,
  type ProcessedImageSet,
} from './image-processing/image-processor.js';
import { UploadPurpose } from './upload-purpose.enum.js';
import { STORAGE_PROVIDER, type StorageProvider } from './storage/storage-provider.js';

const IMAGE_PROCESSING_MESSAGES: Record<ImageProcessorErrorCode, string> = {
  UPLOAD_INVALID_IMAGE: 'فایل ارسال‌شده یک تصویر معتبر نیست.',
  UPLOAD_IMAGE_DIMENSIONS_UNAVAILABLE: 'ابعاد تصویر قابل تشخیص نیست.',
  UPLOAD_IMAGE_DIMENSIONS_TOO_LARGE: 'ابعاد تصویر بیشتر از حد مجاز است.',
  UPLOAD_ANIMATED_IMAGE_NOT_ALLOWED: 'تصاویر متحرک در حال حاضر مجاز نیستند.',
  UPLOAD_IMAGE_PROCESSING_FAILED: 'پردازش تصویر ارسال‌شده امکان‌پذیر نیست.',
};

export type UploadedImageResponse = {
  id: string;
  purpose: UploadPurpose;
  key: string;
  url: string;
  thumbnailKey: string;
  thumbnailUrl: string;
  originalName: string;
  sourceMimeType: string;
  mimeType: 'image/webp';
  originalSizeBytes: number;
  sizeBytes: number;
  width: number;
  height: number;
  thumbnailSizeBytes: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly maxImageBytes: number;

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,

    @Inject(IMAGE_PROCESSOR)
    private readonly imageProcessor: ImageProcessor,

    configService: ConfigService,
  ) {
    this.maxImageBytes = parseMaxImageBytes(configService.get<string>('UPLOAD_MAX_IMAGE_BYTES'));
  }

  async uploadImage(
    file: Express.Multer.File | undefined,
    purpose: UploadPurpose,
    uploadedById: string,
  ): Promise<UploadedImageResponse> {
    this.assertFileExists(file);
    this.assertFileSize(file);
    this.assertDeclaredMimeType(file);

    const detectedType = await this.detectFileType(file.buffer);

    this.assertDetectedMimeType(file.mimetype, detectedType.mime);

    const processedImages = await this.processImage(file.buffer, uploadedById, purpose);

    const imageId = randomUUID();
    const objectDirectory = this.createObjectDirectory(purpose);

    const imageKey = `${objectDirectory}/${imageId}.webp`;

    const thumbnailKey = `${objectDirectory}/${imageId}-thumb.webp`;

    try {
      const results = await Promise.allSettled([
        this.storageProvider.putObject({
          key: imageKey,
          body: processedImages.main.body,
          contentType: 'image/webp',
        }),
        this.storageProvider.putObject({
          key: thumbnailKey,
          body: processedImages.thumbnail.body,
          contentType: 'image/webp',
        }),
      ]);

      const failedResult = results.find((result) => result.status === 'rejected');

      if (failedResult) {
        throw failedResult.reason;
      }
    } catch (error) {
      await Promise.allSettled([
        this.storageProvider.deleteObject(imageKey),
        this.storageProvider.deleteObject(thumbnailKey),
      ]);

      this.logger.error({
        event: 'image_upload_storage_failed',
        uploadedById,
        purpose,
        error: this.serializeError(error),
      });

      throw new ServiceUnavailableException({
        code: 'UPLOAD_STORAGE_UNAVAILABLE',
        message: 'ذخیره تصویر در حال حاضر امکان‌پذیر نیست. لطفاً دوباره تلاش کنید.',
      });
    }

    this.logger.log({
      event: 'image_uploaded',
      uploadedById,
      purpose,
      imageId,
      imageKey,
      originalSizeBytes: file.size,
      outputSizeBytes: processedImages.main.sizeBytes,
    });

    return {
      id: imageId,
      purpose,
      key: imageKey,
      url: this.storageProvider.getPublicUrl(imageKey),
      thumbnailKey,
      thumbnailUrl: this.storageProvider.getPublicUrl(thumbnailKey),
      originalName: this.sanitizeOriginalName(file.originalname),
      sourceMimeType: detectedType.mime,
      mimeType: 'image/webp',
      originalSizeBytes: file.size,
      sizeBytes: processedImages.main.sizeBytes,
      width: processedImages.main.width,
      height: processedImages.main.height,
      thumbnailSizeBytes: processedImages.thumbnail.sizeBytes,
      thumbnailWidth: processedImages.thumbnail.width,
      thumbnailHeight: processedImages.thumbnail.height,
    };
  }

  private async processImage(
    buffer: Buffer,
    uploadedById: string,
    purpose: UploadPurpose,
  ): Promise<ProcessedImageSet> {
    try {
      return await this.imageProcessor.process(buffer);
    } catch (error) {
      if (error instanceof ImageProcessorError) {
        this.logger.warn({
          event: 'image_upload_processing_rejected',
          uploadedById,
          purpose,
          code: error.code,
        });

        throw new BadRequestException({
          code: error.code,
          message: IMAGE_PROCESSING_MESSAGES[error.code],
        });
      }

      this.logger.error({
        event: 'image_upload_processor_failed',
        uploadedById,
        purpose,
        error: this.serializeError(error),
      });

      throw new ServiceUnavailableException({
        code: 'UPLOAD_PROCESSOR_UNAVAILABLE',
        message: 'سرویس پردازش تصویر در حال حاضر در دسترس نیست.',
      });
    }
  }

  private assertFileExists(
    file: Express.Multer.File | undefined,
  ): asserts file is Express.Multer.File {
    if (!file?.buffer?.length) {
      throw new BadRequestException({
        code: 'UPLOAD_FILE_REQUIRED',
        message: 'فایل تصویر ارسال نشده است.',
      });
    }
  }

  private assertFileSize(file: Express.Multer.File): void {
    if (file.size > this.maxImageBytes) {
      throw new PayloadTooLargeException({
        code: 'UPLOAD_FILE_TOO_LARGE',
        message: `حجم تصویر نباید بیشتر از ` + `${this.maxImageBytes} بایت باشد.`,
      });
    }
  }

  private assertDeclaredMimeType(file: Express.Multer.File): void {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new UnsupportedMediaTypeException({
        code: 'UPLOAD_UNSUPPORTED_MEDIA_TYPE',
        message: 'فقط تصاویر JPEG، PNG و WebP مجاز هستند.',
      });
    }
  }

  private async detectFileType(buffer: Buffer): Promise<{ mime: string }> {
    const detectedType = await fileTypeFromBuffer(buffer);

    if (!detectedType || !ALLOWED_IMAGE_MIME_TYPES.has(detectedType.mime)) {
      throw new UnsupportedMediaTypeException({
        code: 'UPLOAD_INVALID_FILE_SIGNATURE',
        message: 'ساختار واقعی فایل با فرمت‌های تصویری مجاز مطابقت ندارد.',
      });
    }

    return {
      mime: detectedType.mime,
    };
  }

  private assertDetectedMimeType(declaredMimeType: string, detectedMimeType: string): void {
    if (declaredMimeType !== detectedMimeType) {
      throw new UnsupportedMediaTypeException({
        code: 'UPLOAD_MIME_TYPE_MISMATCH',
        message: 'نوع اعلام‌شده فایل با محتوای واقعی آن مطابقت ندارد.',
      });
    }
  }

  private createObjectDirectory(purpose: UploadPurpose): string {
    const currentDate = new Date();
    const year = String(currentDate.getUTCFullYear());
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');

    return `${purpose}/${year}/${month}`;
  }

  private sanitizeOriginalName(originalName: string): string {
    const sanitizedName = basename(originalName)
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .slice(0, 255);

    return sanitizedName || 'image';
  }

  private serializeError(error: unknown): unknown {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return String(error);
  }
}
