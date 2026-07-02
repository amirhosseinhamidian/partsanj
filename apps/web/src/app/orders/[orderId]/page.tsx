import { StorefrontOrderDetailPageClient } from '@/components/storefront/order/storefront-order-detail-page-client';

type OrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderId } = await params;

  return <StorefrontOrderDetailPageClient orderId={orderId} />;
}
