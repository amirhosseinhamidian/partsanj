export const REQUEST_ID_HEADER = 'x-request-id';

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]+$/;
const MAX_REQUEST_ID_LENGTH = 128;

export function normalizeRequestId(
  value: string | null | undefined,
): string | undefined {
  const normalized = value?.trim();

  if (
    !normalized ||
    normalized.length > MAX_REQUEST_ID_LENGTH ||
    !REQUEST_ID_PATTERN.test(normalized)
  ) {
    return undefined;
  }

  return normalized;
}

export function createRequestId(): string {
  return globalThis.crypto.randomUUID();
}
