import { Suspense } from 'react';
import type { Metadata } from 'next';

import { StorefrontPaymentResultPageClient } from '@/components/storefront/payment/storefront-payment-result-page-client';
import { createPrivatePageMetadata } from '@/lib/storefront/seo/private-page-metadata';

export const metadata: Metadata = createPrivatePageMetadata(
  'نتیجه پرداخت',
  'نمایش وضعیت نهایی پرداخت سفارش',
);

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<PaymentResultLoading />}>
      <StorefrontPaymentResultPageClient />
    </Suspense>
  );
}

function PaymentResultLoading() {
  return (
    <main className='mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-4 py-12'>
      <p className='text-sm font-bold text-foreground-secondary'>در حال بررسی نتیجه پرداخت...</p>
    </main>
  );
}
