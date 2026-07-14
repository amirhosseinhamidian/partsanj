import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN?.trim();

function resolveEnabled(): boolean {
  const explicitValue =
    process.env.SENTRY_ENABLED?.trim().toLowerCase();

  if (explicitValue === 'true') {
    return Boolean(dsn);
  }

  if (explicitValue === 'false') {
    return false;
  }

  return Boolean(dsn) && process.env.NODE_ENV !== 'test';
}

function stripQueryAndHash(
  value: string | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value, 'http://partsanj.local');
    url.search = '';
    url.hash = '';

    return /^https?:\/\//i.test(value)
      ? url.toString()
      : url.pathname;
  } catch {
    return value.split(/[?#]/, 1)[0] || undefined;
  }
}

Sentry.init({
  dsn: dsn || undefined,
  enabled: resolveEnabled(),
  environment:
    process.env.SENTRY_ENVIRONMENT ??
    process.env.NODE_ENV ??
    'development',
  release: process.env.SENTRY_RELEASE?.trim() || undefined,

  sendDefaultPii: false,

  // فعلاً فقط Error Monitoring فعال است.
  tracesSampleRate: 0,
  enableLogs: false,

  beforeSend(event) {
    if (event.request) {
      event.request.url = stripQueryAndHash(
        event.request.url,
      );

      delete event.request.headers;
      delete event.request.cookies;
      delete event.request.data;
      delete event.request.query_string;
      delete event.request.env;
    }

    if (event.user?.id !== undefined) {
      event.user = {
        id: String(event.user.id),
      };
    } else {
      delete event.user;
    }

    return event;
  },
});
