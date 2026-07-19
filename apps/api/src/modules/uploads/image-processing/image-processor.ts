export const IMAGE_PROCESSOR = Symbol('IMAGE_PROCESSOR');

export type ProcessedImage = {
  body: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
};

export type ProcessedImageSet = {
  main: ProcessedImage;
  thumbnail: ProcessedImage;
};

export type ImageProcessorErrorCode =
  | 'UPLOAD_INVALID_IMAGE'
  | 'UPLOAD_IMAGE_DIMENSIONS_UNAVAILABLE'
  | 'UPLOAD_IMAGE_DIMENSIONS_TOO_LARGE'
  | 'UPLOAD_ANIMATED_IMAGE_NOT_ALLOWED'
  | 'UPLOAD_IMAGE_PROCESSING_FAILED';

export class ImageProcessorError extends Error {
  constructor(
    public readonly code: ImageProcessorErrorCode,
    public readonly originalError?: unknown,
  ) {
    super(code);
    this.name = 'ImageProcessorError';
  }
}

export interface ImageProcessor {
  process(buffer: Buffer): Promise<ProcessedImageSet>;
}
