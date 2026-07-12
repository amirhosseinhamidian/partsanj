import type { Metadata } from 'next';

import { StorefrontOrderDetailPageClient } from '@/components/storefront/order/storefront-order-detail-page-client';
import { createPrivatePageMetadata } from '@/lib/storefront/seo/private-page-metadata';

export const metadata: Metadata = createPrivatePageMetadata(
  'جزئیات سفارش',
  'مشاهده اطلاعات، وضعیت و جزئیات سفارش',
);

type OrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderId } = await params;

  return <StorefrontOrderDetailPageClient orderId={orderId} />;
}
