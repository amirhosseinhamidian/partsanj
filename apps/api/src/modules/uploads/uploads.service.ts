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
import sharp, { type Metadata } from 'sharp';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_INPUT_IMAGE_DIMENSION,
  MAX_INPUT_IMAGE_PIXELS,
  MAX_OUTPUT_IMAGE_DIMENSION,
  OUTPUT_WEBP_QUALITY,
  THUMBNAIL_IMAGE_DIMENSION,
  parseMaxImageBytes,
} from './upload.constants.js';
import { UploadPurpose } from './upload-purpose.enum.js';
import { STORAGE_PROVIDER, type StorageProvider } from './storage/storage-provider.js';

type ProcessedImage = {
  body: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
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

    const metadata = await this.readImageMetadata(file.buffer);

    this.assertImageMetadata(metadata);

    const [processedImage, thumbnail] = await this.processImage(file.buffer);

    const imageId = randomUUID();
    const objectDirectory = this.createObjectDirectory(purpose);

    const imageKey = `${objectDirectory}/${imageId}.webp`;
    const thumbnailKey = `${objectDirectory}/${imageId}-thumb.webp`;

    try {
      const results = await Promise.allSettled([
        this.storageProvider.putObject({
          key: imageKey,
          body: processedImage.body,
          contentType: 'image/webp',
        }),
        this.storageProvider.putObject({
          key: thumbnailKey,
          body: thumbnail.body,
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
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : String(error),
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
      outputSizeBytes: processedImage.sizeBytes,
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
      sizeBytes: processedImage.sizeBytes,
      width: processedImage.width,
      height: processedImage.height,
      thumbnailSizeBytes: thumbnail.sizeBytes,
      thumbnailWidth: thumbnail.width,
      thumbnailHeight: thumbnail.height,
    };
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
        message: `حجم تصویر نباید بیشتر از ${this.maxImageBytes} بایت باشد.`,
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

  private async detectFileType(buffer: Buffer): Promise<{ ext: string; mime: string }> {
    const detectedType = await fileTypeFromBuffer(buffer);

    if (!detectedType || !ALLOWED_IMAGE_MIME_TYPES.has(detectedType.mime)) {
      throw new UnsupportedMediaTypeException({
        code: 'UPLOAD_INVALID_FILE_SIGNATURE',
        message: 'ساختار واقعی فایل با فرمت‌های تصویری مجاز مطابقت ندارد.',
      });
    }

    return detectedType;
  }

  private assertDetectedMimeType(declaredMimeType: string, detectedMimeType: string): void {
    if (declaredMimeType !== detectedMimeType) {
      throw new UnsupportedMediaTypeException({
        code: 'UPLOAD_MIME_TYPE_MISMATCH',
        message: 'نوع اعلام‌شده فایل با محتوای واقعی آن مطابقت ندارد.',
      });
    }
  }

  private async readImageMetadata(buffer: Buffer): Promise<Metadata> {
    try {
      return await sharp(buffer, {
        failOn: 'error',
        limitInputPixels: MAX_INPUT_IMAGE_PIXELS,
        animated: false,
      }).metadata();
    } catch {
      throw new BadRequestException({
        code: 'UPLOAD_INVALID_IMAGE',
        message: 'فایل ارسال‌شده یک تصویر معتبر نیست.',
      });
    }
  }

  private assertImageMetadata(metadata: Metadata): void {
    if (!metadata.width || !metadata.height) {
      throw new BadRequestException({
        code: 'UPLOAD_IMAGE_DIMENSIONS_UNAVAILABLE',
        message: 'ابعاد تصویر قابل تشخیص نیست.',
      });
    }

    if (metadata.width > MAX_INPUT_IMAGE_DIMENSION || metadata.height > MAX_INPUT_IMAGE_DIMENSION) {
      throw new BadRequestException({
        code: 'UPLOAD_IMAGE_DIMENSIONS_TOO_LARGE',
        message: `طول یا عرض تصویر نباید بیشتر از ${MAX_INPUT_IMAGE_DIMENSION} پیکسل باشد.`,
      });
    }

    if (metadata.pages && metadata.pages > 1) {
      throw new BadRequestException({
        code: 'UPLOAD_ANIMATED_IMAGE_NOT_ALLOWED',
        message: 'تصاویر متحرک در حال حاضر مجاز نیستند.',
      });
    }
  }

  private async processImage(buffer: Buffer): Promise<[ProcessedImage, ProcessedImage]> {
    try {
      const source = sharp(buffer, {
        failOn: 'error',
        limitInputPixels: MAX_INPUT_IMAGE_PIXELS,
        animated: false,
      }).rotate();

      const [mainResult, thumbnailResult] = await Promise.all([
        source
          .clone()
          .resize({
            width: MAX_OUTPUT_IMAGE_DIMENSION,
            height: MAX_OUTPUT_IMAGE_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({
            quality: OUTPUT_WEBP_QUALITY,
            effort: 4,
            smartSubsample: true,
          })
          .toBuffer({
            resolveWithObject: true,
          }),

        source
          .clone()
          .resize({
            width: THUMBNAIL_IMAGE_DIMENSION,
            height: THUMBNAIL_IMAGE_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({
            quality: 76,
            effort: 4,
            smartSubsample: true,
          })
          .toBuffer({
            resolveWithObject: true,
          }),
      ]);

      return [
        {
          body: mainResult.data,
          width: mainResult.info.width,
          height: mainResult.info.height,
          sizeBytes: mainResult.info.size,
        },
        {
          body: thumbnailResult.data,
          width: thumbnailResult.info.width,
          height: thumbnailResult.info.height,
          sizeBytes: thumbnailResult.info.size,
        },
      ];
    } catch {
      throw new BadRequestException({
        code: 'UPLOAD_IMAGE_PROCESSING_FAILED',
        message: 'پردازش تصویر ارسال‌شده امکان‌پذیر نیست.',
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
}
