import { execFile } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MAX_INPUT_IMAGE_DIMENSION,
  MAX_INPUT_IMAGE_PIXELS,
  MAX_OUTPUT_IMAGE_DIMENSION,
  OUTPUT_WEBP_QUALITY,
  THUMBNAIL_IMAGE_DIMENSION,
} from '../upload.constants.js';
import {
  ImageProcessorError,
  type ImageProcessor,
  type ProcessedImage,
  type ProcessedImageSet,
} from './image-processor.js';

type IdentifiedImage = {
  format: string;
  width: number;
  height: number;
  frames: number;
};

type CommandResult = {
  stdout: string;
  stderr: string;
};

type ImageMagickCommand = {
  executable: string;
  prefixArguments: string[];
};

type ImageMagickCommands = {
  convert: ImageMagickCommand;
  identify: ImageMagickCommand;
};

const COMMAND_TIMEOUT_MS = 30_000;
const COMMAND_MAX_BUFFER_BYTES = 1024 * 1024;
const THUMBNAIL_WEBP_QUALITY = 76;

@Injectable()
export class ImageMagickImageProcessor implements ImageProcessor, OnModuleInit {
  private readonly logger = new Logger(ImageMagickImageProcessor.name);

  private readonly temporaryDirectory: string;

  /*
   * Image processing is serialized because this VPS has limited
   * memory and CPU resources.
   */
  private processingQueue: Promise<void> = Promise.resolve();
  private imageMagickCommands!: ImageMagickCommands;

  constructor(configService: ConfigService) {
    const uploadDirectory = configService.get<string>('UPLOAD_DIR')?.trim();

    if (!uploadDirectory) {
      throw new Error('UPLOAD_DIR environment variable is required');
    }

    this.temporaryDirectory = resolve(uploadDirectory, 'tmp');
  }

  private async resolveImageMagickCommands(): Promise<ImageMagickCommands> {
    try {
      /*
       * ImageMagick 7, normally installed on macOS with Homebrew.
       *
       * Conversion:
       *   magick input.jpg output.webp
       *
       * Identification:
       *   magick identify input.jpg
       */
      await this.execute('magick', ['-version'], 10_000);

      return {
        convert: {
          executable: 'magick',
          prefixArguments: [],
        },
        identify: {
          executable: 'magick',
          prefixArguments: ['identify'],
        },
      };
    } catch (magickError) {
      try {
        /*
         * ImageMagick 6, commonly available through the Debian
         * imagemagick package.
         */
        await Promise.all([
          this.execute('convert', ['-version'], 10_000),
          this.execute('identify', ['-version'], 10_000),
        ]);

        return {
          convert: {
            executable: 'convert',
            prefixArguments: [],
          },
          identify: {
            executable: 'identify',
            prefixArguments: [],
          },
        };
      } catch (legacyError) {
        this.logger.error({
          event: 'image_magick_command_not_found',
          magickError: this.serializeCommandError(magickError),
          legacyError: this.serializeCommandError(legacyError),
        });

        throw new Error(
          'ImageMagick command-line tools are not installed or are not available in PATH',
        );
      }
    }
  }

  private executeImageMagick(
    command: ImageMagickCommand,
    argumentsList: string[],
    timeout = COMMAND_TIMEOUT_MS,
  ): Promise<CommandResult> {
    return this.execute(
      command.executable,
      [...command.prefixArguments, ...argumentsList],
      timeout,
    );
  }

  private serializeCommandError(error: unknown): unknown {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
      };
    }

    return String(error);
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.temporaryDirectory, {
      recursive: true,
      mode: 0o700,
    });

    await access(this.temporaryDirectory, fsConstants.R_OK | fsConstants.W_OK);

    this.imageMagickCommands = await this.resolveImageMagickCommands();

    const version = await this.executeImageMagick(
      this.imageMagickCommands.convert,
      ['-version'],
      10_000,
    );

    const formats = await this.executeImageMagick(
      this.imageMagickCommands.identify,
      ['-list', 'format'],
      10_000,
    );

    if (!/^[\s]*WEBP\*?[\s]+WEBP[\s]+rw\+/m.test(formats.stdout)) {
      throw new Error('ImageMagick was installed without writable WebP support');
    }

    this.logger.log({
      event: 'image_magick_initialized',
      executable: this.imageMagickCommands.convert.executable,
      version: version.stdout.split(/\r?\n/)[0],
    });
  }

  async process(buffer: Buffer): Promise<ProcessedImageSet> {
    return this.runExclusively(() => this.processInternal(buffer));
  }

  private async processInternal(buffer: Buffer): Promise<ProcessedImageSet> {
    const workingDirectory = await mkdtemp(join(this.temporaryDirectory, 'image-process-'));

    const inputPath = join(workingDirectory, 'input-image');
    const mainOutputPath = join(workingDirectory, 'main.webp');
    const thumbnailOutputPath = join(workingDirectory, 'thumbnail.webp');

    try {
      await writeFile(inputPath, buffer, {
        flag: 'wx',
        mode: 0o600,
      });

      const inputMetadata = await this.identifyInputImage(inputPath);

      this.validateInputMetadata(inputMetadata);

      try {
        await this.convertImage(
          inputPath,
          mainOutputPath,
          MAX_OUTPUT_IMAGE_DIMENSION,
          OUTPUT_WEBP_QUALITY,
        );

        await this.convertImage(
          inputPath,
          thumbnailOutputPath,
          THUMBNAIL_IMAGE_DIMENSION,
          THUMBNAIL_WEBP_QUALITY,
        );

        const [mainBody, thumbnailBody, mainMetadata, thumbnailMetadata] = await Promise.all([
          readFile(mainOutputPath),
          readFile(thumbnailOutputPath),
          this.identifyOutputImage(mainOutputPath),
          this.identifyOutputImage(thumbnailOutputPath),
        ]);

        if (mainMetadata.format !== 'WEBP' || thumbnailMetadata.format !== 'WEBP') {
          throw new Error('ImageMagick output format was not WebP');
        }

        return {
          main: this.createProcessedImage(mainBody, mainMetadata),
          thumbnail: this.createProcessedImage(thumbnailBody, thumbnailMetadata),
        };
      } catch (error) {
        if (error instanceof ImageProcessorError) {
          throw error;
        }

        throw new ImageProcessorError('UPLOAD_IMAGE_PROCESSING_FAILED', error);
      }
    } finally {
      await rm(workingDirectory, {
        recursive: true,
        force: true,
      });
    }
  }

  private async identifyInputImage(inputPath: string): Promise<IdentifiedImage> {
    try {
      return await this.identifyImage(inputPath);
    } catch (error) {
      if (error instanceof ImageProcessorError) {
        throw error;
      }

      throw new ImageProcessorError('UPLOAD_INVALID_IMAGE', error);
    }
  }

  private async identifyOutputImage(outputPath: string): Promise<IdentifiedImage> {
    return this.identifyImage(outputPath);
  }

  private async identifyImage(imagePath: string): Promise<IdentifiedImage> {
    const result = await this.executeImageMagick(this.imageMagickCommands.identify, [
      ...this.createResourceLimitArguments(),
      '-ping',
      '-format',
      '%m\t%w\t%h\t%n\n',
      imagePath,
    ]);

    const rows = result.stdout.trim().split(/\r?\n/).filter(Boolean);

    if (rows.length === 0) {
      throw new Error('ImageMagick did not return image metadata');
    }

    if (rows.length > 1) {
      throw new ImageProcessorError('UPLOAD_ANIMATED_IMAGE_NOT_ALLOWED');
    }

    const [format, widthText, heightText, frameCountText] = rows[0].split('\t');

    const width = Number.parseInt(widthText, 10);
    const height = Number.parseInt(heightText, 10);
    const frames = Number.parseInt(frameCountText, 10);

    if (
      !format ||
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      !Number.isSafeInteger(frames)
    ) {
      throw new ImageProcessorError('UPLOAD_IMAGE_DIMENSIONS_UNAVAILABLE');
    }

    return {
      format: format.toUpperCase(),
      width,
      height,
      frames,
    };
  }

  private validateInputMetadata(metadata: IdentifiedImage): void {
    if (!['JPEG', 'PNG', 'WEBP'].includes(metadata.format)) {
      throw new ImageProcessorError('UPLOAD_INVALID_IMAGE');
    }

    if (metadata.width <= 0 || metadata.height <= 0) {
      throw new ImageProcessorError('UPLOAD_IMAGE_DIMENSIONS_UNAVAILABLE');
    }

    if (metadata.frames !== 1) {
      throw new ImageProcessorError('UPLOAD_ANIMATED_IMAGE_NOT_ALLOWED');
    }

    if (
      metadata.width > MAX_INPUT_IMAGE_DIMENSION ||
      metadata.height > MAX_INPUT_IMAGE_DIMENSION ||
      metadata.width * metadata.height > MAX_INPUT_IMAGE_PIXELS
    ) {
      throw new ImageProcessorError('UPLOAD_IMAGE_DIMENSIONS_TOO_LARGE');
    }
  }

  private async convertImage(
    inputPath: string,
    outputPath: string,
    maximumDimension: number,
    quality: number,
  ): Promise<void> {
    await this.executeImageMagick(this.imageMagickCommands.convert, [
      ...this.createResourceLimitArguments(),
      `${inputPath}[0]`,
      '-auto-orient',
      '-colorspace',
      'sRGB',
      '-resize',
      `${maximumDimension}x${maximumDimension}>`,
      '-strip',
      '-quality',
      String(quality),
      '-define',
      'webp:method=4',
      outputPath,
    ]);
  }

  private createProcessedImage(body: Buffer, metadata: IdentifiedImage): ProcessedImage {
    return {
      body,
      width: metadata.width,
      height: metadata.height,
      sizeBytes: body.byteLength,
    };
  }

  private createResourceLimitArguments(): string[] {
    return [
      '-limit',
      'memory',
      '256MiB',
      '-limit',
      'map',
      '512MiB',
      '-limit',
      'disk',
      '512MiB',
      '-limit',
      'area',
      String(MAX_INPUT_IMAGE_PIXELS),
      '-limit',
      'thread',
      '1',
    ];
  }

  private async runExclusively<T>(operation: () => Promise<T>): Promise<T> {
    const previousOperation = this.processingQueue;

    let releaseQueue!: () => void;

    this.processingQueue = new Promise<void>((resolveQueue) => {
      releaseQueue = resolveQueue;
    });

    await previousOperation;

    try {
      return await operation();
    } finally {
      releaseQueue();
    }
  }

  private execute(
    command: string,
    argumentsList: string[],
    timeout = COMMAND_TIMEOUT_MS,
  ): Promise<CommandResult> {
    return new Promise((resolveCommand, rejectCommand) => {
      execFile(
        command,
        argumentsList,
        {
          encoding: 'utf8',
          timeout,
          maxBuffer: COMMAND_MAX_BUFFER_BYTES,
          killSignal: 'SIGKILL',
          windowsHide: true,
          env: {
            ...process.env,
            TMPDIR: this.temporaryDirectory,
            MAGICK_TMPDIR: this.temporaryDirectory,
          },
        },
        (error, stdout, stderr) => {
          if (error) {
            const errorOutput = stderr.trim() || stdout.trim() || error.message;

            rejectCommand(new Error(`${command} failed: ${errorOutput}`));

            return;
          }

          resolveCommand({
            stdout,
            stderr,
          });
        },
      );
    });
  }
}
