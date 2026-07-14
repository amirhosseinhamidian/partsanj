import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
};

const sentryOrg = process.env.SENTRY_ORG?.trim();
const sentryProject = process.env.SENTRY_PROJECT_WEB?.trim();
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN?.trim();

const shouldUploadSentrySourceMaps = Boolean(
  sentryOrg &&
    sentryProject &&
    sentryAuthToken,
);

export default shouldUploadSentrySourceMaps
  ? withSentryConfig(nextConfig, {
      org: sentryOrg,
      project: sentryProject,
      authToken: sentryAuthToken,

      // فقط در CI جزئیات آپلود source map نمایش داده شود.
      silent: !process.env.CI,

      // stack traceهای خواناتر برای client.
      widenClientFileUpload: true,
    })
  : nextConfig;
