import { HomeBenefits } from '@/components/storefront/home/home-benefits';
import { HomeHero } from '@/components/storefront/home/home-hero';
import { HomeMainCategories } from '@/components/storefront/home/home-main-categories';
import { getHomeMainCategories } from '@/lib/storefront/home/home-categories.server';

export default async function Home() {
  const homeCategories = await getHomeMainCategories();
  return (
    <>
      <HomeHero />
      <HomeMainCategories categories={homeCategories} />
      <HomeBenefits />
    </>
  );
}
