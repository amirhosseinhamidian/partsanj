import { HomeBenefits } from '@/components/storefront/home/home-benefits';
import { HomeFeaturedProducts } from '@/components/storefront/home/home-featured-products';
import { HomeHero } from '@/components/storefront/home/home-hero';
import { HomeMainCategories } from '@/components/storefront/home/home-main-categories';
import { HomePurchaseProcess } from '@/components/storefront/home/home-purchase-process';
import { getHomeMainCategories } from '@/lib/storefront/home/home-categories.server';
import { getHomeFeaturedProducts } from '@/lib/storefront/home/home-featured-products.server';
import { getHomeBlogPosts } from '@/lib/storefront/home/home-blog-posts.server';
import { HomeBlogGuide } from '@/components/storefront/home/home-blog-guide';

export default async function Home() {
  const [homeCategories, featuredProducts, homeBlogPosts] = await Promise.all([
    getHomeMainCategories(),
    getHomeFeaturedProducts(),
    getHomeBlogPosts(),
  ]);
  return (
    <>
      <HomeHero />
      <div id='home-main-categories' className='scroll-mt-28'>
        <HomeMainCategories categories={homeCategories} />
      </div>
      <HomeBenefits className='mt-10' />
      <HomeFeaturedProducts products={featuredProducts} className='mt-10' />
      <HomePurchaseProcess className='mt-10' />
      <HomeBlogGuide posts={homeBlogPosts} className='mt-12' />
    </>
  );
}
