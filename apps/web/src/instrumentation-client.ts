import * as Sentry from '@sentry/nextjs';

import { scrubSentryEvent } from '@/lib/monitoring/sentry-event-scrubber';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn) && process.env.NODE_ENV !== 'test',
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
    process.env.NODE_ENV ??
    'development',
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE?.trim() || undefined,

  sendDefaultPii: false,

  // فعلاً فقط Error Monitoring فعال است.
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  enableLogs: false,

  beforeSend(event) {
    return scrubSentryEvent(event);
  },
});
