export function normalizeImageUrl(value: string): string {
  return value.trim();
}

export function isValidRemoteImageUrl(value: string): boolean {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
