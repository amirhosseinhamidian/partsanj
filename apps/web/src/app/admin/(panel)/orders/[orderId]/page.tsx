import { AdminOrderDetailPageClient } from '@/components/admin/orders/admin-order-detail-page-client';

type AdminOrderDetailPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { orderId } = await params;

  return <AdminOrderDetailPageClient orderId={orderId} />;
}
