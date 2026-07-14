import * as Sentry from '@sentry/nextjs';

import { scrubSentryEvent } from '@/lib/monitoring/sentry-event-scrubber';

const dsn =
  process.env.SENTRY_DSN?.trim() ??
  process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn) && process.env.NODE_ENV !== 'test',
  environment:
    process.env.SENTRY_ENVIRONMENT ??
    process.env.NODE_ENV ??
    'development',
  release:
    process.env.SENTRY_RELEASE?.trim() ??
    process.env.NEXT_PUBLIC_SENTRY_RELEASE?.trim() ??
    undefined,

  sendDefaultPii: false,
  tracesSampleRate: 0,
  enableLogs: false,

  beforeSend(event) {
    return scrubSentryEvent(event);
  },
});
