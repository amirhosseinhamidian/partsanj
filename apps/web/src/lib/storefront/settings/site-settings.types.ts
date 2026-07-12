export type StorefrontSiteSettings = {
  siteName: string;
  siteTagline: string | null;
  siteBaseUrl: string;

  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;

  supportPhone: string | null;
  supportMobile: string | null;

  whatsappUrl: string | null;
  telegramUrl: string | null;
  baleUrl: string | null;
  instagramUrl: string | null;

  defaultSeoTitle: string | null;
  defaultSeoDescription: string | null;
  defaultOgImageUrl: string | null;
  noIndexSite: boolean;

  storeEnabled: boolean;
  orderingEnabled: boolean;
  showPrices: boolean;
};

export type StorefrontSiteSettingsResponse = {
  data: StorefrontSiteSettings;
};
