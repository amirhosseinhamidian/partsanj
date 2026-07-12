import type { Metadata } from 'next';

import { StorefrontProductsPageClient } from '@/components/storefront/catalog/storefront-products-page-client';
import { buildSeoMetadata } from '@/lib/storefront/seo/seo-metadata';
import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TRACKING_QUERY_KEYS = new Set(['gclid', 'fbclid', 'ref', 'source']);

function hasMeaningfulSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  return Object.entries(searchParams).some(([key, value]) => {
    const normalizedKey = key.trim().toLowerCase();
    const hasValue = Array.isArray(value)
      ? value.some((item) => item.trim().length > 0)
      : Boolean(value?.trim());

    if (!hasValue) {
      return false;
    }
    if (normalizedKey.startsWith('utm_')) {
      return false;
    }

    if (TRACKING_QUERY_KEYS.has(normalizedKey)) {
      return false;
    }

    /**
     * سایر پارامترها مانند:
     *
     * search
     * sort
     * brand
     * category
     * vehicle
     * minPrice
     * maxPrice
     * page
     *
     * به‌عنوان پارامتر محتوایی در نظر گرفته می‌شوند.
     */
    return true;
  });
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const [settings, resolvedSearchParams] = await Promise.all([
    getStorefrontSiteSettings(),
    searchParams,
  ]);

  const hasFilters = hasMeaningfulSearchParams(resolvedSearchParams);

  const title = `فروشگاه قطعات یدکی خودرو | ${settings.siteName}`;

  const description =
    `مشاهده و خرید قطعات یدکی خودرو در ${settings.siteName}، ` +
    'با امکان جست‌وجو، بررسی مشخصات و انتخاب قطعه سازگار با خودرو.';

  return buildSeoMetadata({
    title: 'فروشگاه قطعات یدکی خودرو',

    /**
     * عنوان کامل است؛ بنابراین helper آن را absolute
     * قرار می‌دهد و template اصلی نام سایت را تکرار نمی‌کند.
     */
    seoTitle: title,

    description,

    /**
     * تمام حالت‌های فیلترشده به صفحه اصلی محصولات
     * canonical می‌شوند.
     */
    canonicalPath: '/products',

    /**
     * اولویت noindex:
     *
     * 1. noindex کلی سایت
     * 2. وجود فیلتر، جست‌وجو، مرتب‌سازی یا pagination
     */
    globalNoIndex: settings.noIndexSite,
    pageNoIndex: hasFilters,

    type: 'website',

    openGraphTitle: title,
    openGraphDescription: description,

    openGraphImage: settings.defaultOgImageUrl
      ? {
          url: settings.defaultOgImageUrl,
          alt: `فروشگاه قطعات یدکی ${settings.siteName}`,
        }
      : null,
  });
}

export default function ProductsPage() {
  return <StorefrontProductsPageClient />;
}
