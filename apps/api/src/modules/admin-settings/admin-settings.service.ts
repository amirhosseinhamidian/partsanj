import { Injectable } from '@nestjs/common';
import { AdminAuditAction, AdminAuditEntityType, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto.js';

const SITE_SETTINGS_ID = 'site';

const siteSettingsSelect = {
  id: true,
  siteName: true,
  siteTagline: true,
  siteBaseUrl: true,

  logoLightUrl: true,
  logoDarkUrl: true,
  faviconUrl: true,

  supportPhone: true,
  supportMobile: true,

  whatsappUrl: true,
  telegramUrl: true,
  baleUrl: true,
  instagramUrl: true,

  defaultSeoTitle: true,
  defaultSeoDescription: true,
  defaultOgImageUrl: true,
  noIndexSite: true,

  storeEnabled: true,
  orderingEnabled: true,
  showPrices: true,

  defaultShippingCostToman: true,
  freeShippingThresholdToman: true,
  orderExpirationMinutes: true,

  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SiteSettingSelect;

type SiteSettingsRecord = Prisma.SiteSettingGetPayload<{
  select: typeof siteSettingsSelect;
}>;

type SiteSettingsMutationData = {
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

type SettingsChangeValue = {
  from: string | number | boolean | null;
  to: string | number | boolean | null;
};

type SettingsChanges = Record<string, SettingsChangeValue>;

const defaultSiteSettingsData = {
  id: SITE_SETTINGS_ID,
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
} satisfies Prisma.SiteSettingCreateInput;

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findSettings() {
    const settings = await this.findOrCreateSettings();

    return {
      data: settings,
    };
  }

  async updateSettings(dto: UpdateSiteSettingsDto, actorUserId: string) {
    const updated = await this.prisma.$transaction(async (transaction) => {
      let current = await transaction.siteSetting.findUnique({
        where: {
          id: SITE_SETTINGS_ID,
        },
        select: siteSettingsSelect,
      });

      if (!current) {
        current = await transaction.siteSetting.create({
          data: defaultSiteSettingsData,
          select: siteSettingsSelect,
        });
      }

      const next = this.buildNextSettings(current, dto);
      const changes = this.buildSettingsChanges(current, next);

      if (Object.keys(changes).length === 0) {
        return current;
      }

      const settings = await transaction.siteSetting.update({
        where: {
          id: SITE_SETTINGS_ID,
        },
        data: next,
        select: siteSettingsSelect,
      });

      await transaction.adminAuditLog.create({
        data: {
          actorUserId,
          entityType: AdminAuditEntityType.SITE_SETTING,
          entityId: SITE_SETTINGS_ID,
          entityLabel: 'تنظیمات سایت',
          action: AdminAuditAction.UPDATED,
          changes: changes,
        },
      });

      return settings;
    });

    return {
      data: updated,
    };
  }

  private async findOrCreateSettings() {
    const current = await this.prisma.siteSetting.findUnique({
      where: {
        id: SITE_SETTINGS_ID,
      },
      select: siteSettingsSelect,
    });

    if (current) {
      return current;
    }

    return this.prisma.siteSetting.create({
      data: defaultSiteSettingsData,
      select: siteSettingsSelect,
    });
  }

  async findPublicSettings() {
    const settings = await this.findOrCreateSettings();

    return {
      data: {
        siteName: settings.siteName,
        siteTagline: settings.siteTagline,
        siteBaseUrl: settings.siteBaseUrl,

        logoLightUrl: settings.logoLightUrl,
        logoDarkUrl: settings.logoDarkUrl,
        faviconUrl: settings.faviconUrl,

        supportPhone: settings.supportPhone,
        supportMobile: settings.supportMobile,

        whatsappUrl: settings.whatsappUrl,
        telegramUrl: settings.telegramUrl,
        baleUrl: settings.baleUrl,
        instagramUrl: settings.instagramUrl,

        defaultSeoTitle: settings.defaultSeoTitle,
        defaultSeoDescription: settings.defaultSeoDescription,
        defaultOgImageUrl: settings.defaultOgImageUrl,
        noIndexSite: settings.noIndexSite,

        storeEnabled: settings.storeEnabled,
        orderingEnabled: settings.orderingEnabled,
        showPrices: settings.showPrices,
      },
    };
  }

  private buildNextSettings(
    current: SiteSettingsRecord,
    dto: UpdateSiteSettingsDto,
  ): SiteSettingsMutationData {
    return {
      siteName: dto.siteName,
      siteTagline: dto.siteTagline ?? null,
      siteBaseUrl: dto.siteBaseUrl,

      logoLightUrl: dto.logoLightUrl ?? null,
      logoDarkUrl: dto.logoDarkUrl ?? null,
      faviconUrl: dto.faviconUrl ?? null,

      supportPhone: dto.supportPhone ?? null,
      supportMobile: dto.supportMobile ?? null,

      whatsappUrl: dto.whatsappUrl ?? null,
      telegramUrl: dto.telegramUrl ?? null,
      baleUrl: dto.baleUrl ?? null,
      instagramUrl: dto.instagramUrl ?? null,

      defaultSeoTitle: dto.defaultSeoTitle ?? null,
      defaultSeoDescription: dto.defaultSeoDescription ?? null,
      defaultOgImageUrl: dto.defaultOgImageUrl ?? null,
      noIndexSite: dto.noIndexSite,

      storeEnabled: dto.storeEnabled,
      orderingEnabled: dto.orderingEnabled,
      showPrices: dto.showPrices,

      defaultShippingCostToman: dto.defaultShippingCostToman ?? null,
      freeShippingThresholdToman: dto.freeShippingThresholdToman ?? null,
      orderExpirationMinutes: dto.orderExpirationMinutes,
    };
  }

  private buildSettingsChanges(
    current: SiteSettingsRecord,
    next: SiteSettingsMutationData,
  ): SettingsChanges {
    const changes: SettingsChanges = {};

    this.addChange(changes, 'siteName', current.siteName, next.siteName);
    this.addChange(changes, 'siteTagline', current.siteTagline, next.siteTagline);
    this.addChange(changes, 'siteBaseUrl', current.siteBaseUrl, next.siteBaseUrl);

    this.addChange(changes, 'logoLightUrl', current.logoLightUrl, next.logoLightUrl);
    this.addChange(changes, 'logoDarkUrl', current.logoDarkUrl, next.logoDarkUrl);
    this.addChange(changes, 'faviconUrl', current.faviconUrl, next.faviconUrl);

    this.addChange(changes, 'supportPhone', current.supportPhone, next.supportPhone);
    this.addChange(changes, 'supportMobile', current.supportMobile, next.supportMobile);

    this.addChange(changes, 'whatsappUrl', current.whatsappUrl, next.whatsappUrl);
    this.addChange(changes, 'telegramUrl', current.telegramUrl, next.telegramUrl);
    this.addChange(changes, 'baleUrl', current.baleUrl, next.baleUrl);
    this.addChange(changes, 'instagramUrl', current.instagramUrl, next.instagramUrl);

    this.addChange(changes, 'defaultSeoTitle', current.defaultSeoTitle, next.defaultSeoTitle);

    this.addChange(
      changes,
      'defaultSeoDescription',
      current.defaultSeoDescription,
      next.defaultSeoDescription,
    );

    this.addChange(changes, 'defaultOgImageUrl', current.defaultOgImageUrl, next.defaultOgImageUrl);

    this.addChange(changes, 'noIndexSite', current.noIndexSite, next.noIndexSite);

    this.addChange(changes, 'storeEnabled', current.storeEnabled, next.storeEnabled);
    this.addChange(changes, 'orderingEnabled', current.orderingEnabled, next.orderingEnabled);
    this.addChange(changes, 'showPrices', current.showPrices, next.showPrices);

    this.addChange(
      changes,
      'defaultShippingCostToman',
      current.defaultShippingCostToman,
      next.defaultShippingCostToman,
    );

    this.addChange(
      changes,
      'freeShippingThresholdToman',
      current.freeShippingThresholdToman,
      next.freeShippingThresholdToman,
    );

    this.addChange(
      changes,
      'orderExpirationMinutes',
      current.orderExpirationMinutes,
      next.orderExpirationMinutes,
    );

    return changes;
  }

  private addChange(
    changes: SettingsChanges,
    key: string,
    before: string | number | boolean | null,
    after: string | number | boolean | null,
  ) {
    if (before === after) {
      return;
    }

    changes[key] = {
      from: before,
      to: after,
    };
  }
}
