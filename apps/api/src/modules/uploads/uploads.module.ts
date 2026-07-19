import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module.js';
import { parseMaxImageBytes } from './upload.constants.js';
import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';
import { IMAGE_PROCESSOR } from './image-processing/image-processor.js';
import { ImageMagickImageProcessor } from './image-processing/image-magick-image-processor.js';
import { LocalStorageProvider } from './storage/local-storage.provider.js';
import { STORAGE_PROVIDER } from './storage/storage-provider.js';

@Module({
  imports: [
    AuthModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        limits: {
          fileSize: parseMaxImageBytes(configService.get<string>('UPLOAD_MAX_IMAGE_BYTES')),
          files: 1,
          fields: 2,
          parts: 3,
        },
      }),
    }),
  ],
  controllers: [UploadsController],
  providers: [
    UploadsService,

    LocalStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useExisting: LocalStorageProvider,
    },

    ImageMagickImageProcessor,
    {
      provide: IMAGE_PROCESSOR,
      useExisting: ImageMagickImageProcessor,
    },
  ],
})
export class UploadsModule {}
