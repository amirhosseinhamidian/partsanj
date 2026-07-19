export const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const MAX_INPUT_IMAGE_PIXELS = 40_000_000;
export const MAX_INPUT_IMAGE_DIMENSION = 12_000;

export const MAX_OUTPUT_IMAGE_DIMENSION = 2_400;
export const THUMBNAIL_IMAGE_DIMENSION = 480;

export const OUTPUT_WEBP_QUALITY = 82;

export const ALLOWED_IMAGE_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function parseMaxImageBytes(value: string | undefined): number {
  if (!value?.trim()) {
    return DEFAULT_MAX_IMAGE_BYTES;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    return DEFAULT_MAX_IMAGE_BYTES;
  }

  return parsedValue;
}
