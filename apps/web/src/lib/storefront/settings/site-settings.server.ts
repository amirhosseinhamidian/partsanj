import 'server-only';

import { publicNestApi } from '@/lib/server/public-nest-api';
import type {
  StorefrontSiteSettings,
  StorefrontSiteSettingsResponse,
} from '@/lib/storefront/settings/site-settings.types';

const FALLBACK_SITE_SETTINGS: StorefrontSiteSettings = {
  siteName: 'پارت‌سنج',
  siteTagline: 'انتخاب مطمئن قطعات خودرو',
  siteBaseUrl: 'https://partsanj.com',

  logoLightUrl: null,
  logoDarkUrl: null,
  faviconUrl: null,

  supportPhone: null,
  supportMobile: null,

  whatsappUrl: null,
  telegramUrl: null,
  baleUrl: null,
  instagramUrl: null,

  defaultSeoTitle: 'پارت‌سنج | فروشگاه قطعات یدکی خودرو',
  defaultSeoDescription:
    'پارت‌سنج؛ فروشگاه تخصصی قطعات یدکی خودرو با امکان بررسی سازگاری قطعه با خودرو.',
  defaultOgImageUrl: null,
  noIndexSite: false,

  storeEnabled: true,
  orderingEnabled: true,
  showPrices: true,
};

export async function getStorefrontSiteSettings(): Promise<StorefrontSiteSettings> {
  try {
    const response = await publicNestApi<StorefrontSiteSettingsResponse>('/api/v1/settings', {
      method: 'GET',
      next: {
        revalidate: 1,
        tags: ['site-settings'],
      },
    });

    return response.data;
  } catch {
    return FALLBACK_SITE_SETTINGS;
  }
}
