import { CustomerOrderDetailPageClient } from '@/components/storefront/account/orders/customer-order-detail-page-client';

type CustomerOrderDetailPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function CustomerOrderDetailPage({ params }: CustomerOrderDetailPageProps) {
  const { orderId } = await params;

  return <CustomerOrderDetailPageClient orderId={orderId} />;
}
