import { StorefrontProductDetailPageClient } from '@/components/storefront/catalog/storefront-product-detail-page-client';

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  return <StorefrontProductDetailPageClient slug={slug} />;
}
