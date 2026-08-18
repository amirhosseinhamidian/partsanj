import type { Metadata } from 'next';

import { HomeBenefits } from '@/components/storefront/home/home-benefits';
import { HomeBlogGuide } from '@/components/storefront/home/home-blog-guide';
import { HomeFeaturedProducts } from '@/components/storefront/home/home-featured-products';
import { HomeHero } from '@/components/storefront/home/home-hero';
import { HomeMainCategories } from '@/components/storefront/home/home-main-categories';
import { HomePurchaseProcess } from '@/components/storefront/home/home-purchase-process';
import { HomeVehicleModels } from '@/components/storefront/home/home-vehicle-models';
import { getHomeBlogPosts } from '@/lib/storefront/home/home-blog-posts.server';
import { getHomeMainCategories } from '@/lib/storefront/home/home-categories.server';
import { getHomeFeaturedProducts } from '@/lib/storefront/home/home-featured-products.server';
import { getHomeVehicleModels } from '@/lib/storefront/home/home-vehicles.server';
import { buildSeoMetadata } from '@/lib/storefront/seo/seo-metadata';
import { StorefrontStructuredData } from '@/lib/storefront/seo/storefront-structured-data';
import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStorefrontSiteSettings();
  const siteName = settings.siteName?.trim() || 'پارت‌سنج';
  const title = settings.defaultSeoTitle?.trim() || siteName;
  const description =
    settings.defaultSeoDescription?.trim() ||
    settings.siteTagline?.trim() ||
    'فروشگاه تخصصی قطعات یدکی خودرو با امکان بررسی مشخصات و سازگاری قطعات با خودرو.';

  return buildSeoMetadata({
    title: siteName,
    seoTitle: title,
    description,
    canonicalPath: '/',
    globalNoIndex: settings.noIndexSite,
    type: 'website',
    openGraphTitle: title,
    openGraphDescription: description,
    openGraphImage: settings.defaultOgImageUrl
      ? {
          url: settings.defaultOgImageUrl,
          alt: siteName,
        }
      : null,
  });
}

export default async function Home() {
  const [homeCategories, homeVehicleModels, featuredProducts, homeBlogPosts, settings] =
    await Promise.all([
      getHomeMainCategories(),
      getHomeVehicleModels(),
      getHomeFeaturedProducts(),
      getHomeBlogPosts(),
      getStorefrontSiteSettings(),
    ]);

  return (
    <>
      <StorefrontStructuredData settings={settings} />

      <HomeHero />

      <div id='home-main-categories' className='scroll-mt-28'>
        <HomeMainCategories categories={homeCategories} />
      </div>

      <HomeVehicleModels vehicles={homeVehicleModels} className='mt-2' />
      <HomeBenefits className='mt-8 sm:mt-10' />
      <HomeFeaturedProducts products={featuredProducts} className='mt-10' />
      <HomePurchaseProcess className='mt-10' />
      <HomeBlogGuide posts={homeBlogPosts} className='mt-12' />
    </>
  );
}
