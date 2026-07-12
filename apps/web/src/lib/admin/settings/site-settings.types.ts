export type SiteSettings = {
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

  defaultShippingCostToman: number | null;
  freeShippingThresholdToman: number | null;
  orderExpirationMinutes: number;
};

export type SiteSettingsResponse = {
  data: SiteSettings;
};

export type UpdateSiteSettingsPayload = SiteSettings;
