export const REQUEST_ID_HEADER = 'x-request-id';

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]+$/;
const MAX_REQUEST_ID_LENGTH = 128;

export function normalizeRequestId(
  value: string | string[] | null | undefined,
): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  const normalized = candidate?.trim();

  if (
    !normalized ||
    normalized.length > MAX_REQUEST_ID_LENGTH ||
    !REQUEST_ID_PATTERN.test(normalized)
  ) {
    return undefined;
  }

  return normalized;
}
