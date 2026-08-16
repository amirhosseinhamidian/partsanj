import type { MetadataRoute } from 'next';

import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

export const revalidate = 300;

function resolveSiteOrigin(siteBaseUrl?: string | null): string {
  const candidates = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    siteBaseUrl,
    process.env.NODE_ENV === 'production' ? 'https://partsanj.ir' : 'http://localhost:3000',
  ];

  for (const candidate of candidates) {
    const normalizedCandidate = candidate?.trim();

    if (!normalizedCandidate) {
      continue;
    }

    try {
      return new URL(normalizedCandidate).origin;
    } catch {
      // مقدار نامعتبر نادیده گرفته می‌شود.
    }
  }

  return process.env.NODE_ENV === 'production' ? 'https://partsanj.ir' : 'http://localhost:3000';
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getStorefrontSiteSettings();

  const origin = resolveSiteOrigin(settings.siteBaseUrl);

  return {
    rules: {
      userAgent: '*',

      /*
       * صفحات عمومی باید crawlable باشند تا
       * robots meta مثل noindex دیده شود.
       */
      allow: '/',

      /*
       * فقط بخش‌هایی که واقعاً نیازی به crawl
       * ندارند مسدود می‌شوند.
       */
      disallow: ['/admin', '/admin/', '/api', '/api/'],
    },

    sitemap: `${origin}/sitemap.xml`,
  };
}
