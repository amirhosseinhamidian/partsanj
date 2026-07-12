import { SiteSettingsPageClient } from '@/components/admin/settings/site-settings-page-client';
import type { SiteSettings } from '@/lib/admin/settings/site-settings.types';

const DEFAULT_SITE_SETTINGS: SiteSettings = {
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

  defaultShippingCostToman: null,
  freeShippingThresholdToman: null,
  orderExpirationMinutes: 30,
};

export default function AdminSettingsPage() {
  return <SiteSettingsPageClient initialSettings={DEFAULT_SITE_SETTINGS} />;
}
