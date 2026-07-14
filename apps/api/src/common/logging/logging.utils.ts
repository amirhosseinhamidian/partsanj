import { getRequestId } from '../request-context/request-context.js';

const KAVENEGAR_API_KEY_PATTERN =
  /https:\/\/api\.kavenegar\.com\/v1\/[^/\s]+/gi;

const SECRET_ASSIGNMENT_PATTERN =
  /\b(authorization|cookie|password|passwd|secret|token|api[_-]?key)\b(\s*[:=]\s*)([^\s,;]+)/gi;

const JWT_PATTERN =
  /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g;

function sanitizeLogText(value: string): string {
  return value
    .replace(
      KAVENEGAR_API_KEY_PATTERN,
      'https://api.kavenegar.com/v1/[REDACTED]',
    )
    .replace(
      SECRET_ASSIGNMENT_PATTERN,
      '$1$2[REDACTED]',
    )
    .replace(JWT_PATTERN, '[REDACTED_JWT]');
}

export function createLogContext(
  event: string,
  fields: Record<string, unknown> = {},
): Record<string, unknown> {
  const requestId = getRequestId();

  return {
    event,
    service: 'partsanj-api',
    environment:
      process.env.NODE_ENV ?? 'development',
    ...(requestId
      ? {
          requestId,
        }
      : {}),
    ...fields,
  };
}

export function createErrorDetails(
  error: unknown,
): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return {
      name: 'UnknownError',
    };
  }

  return {
    name: error.name,
    message: sanitizeLogText(error.message),
    ...(error.stack
      ? {
          stack: sanitizeLogText(error.stack),
        }
      : {}),
  };
}

export function maskMobile(mobile: string): string {
  const normalized = mobile.trim();

  if (normalized.length < 7) {
    return '[REDACTED_MOBILE]';
  }

  return `${normalized.slice(0, 4)}***${normalized.slice(-3)}`;
}
