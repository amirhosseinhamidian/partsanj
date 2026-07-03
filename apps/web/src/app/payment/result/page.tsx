import { Suspense } from 'react';
import { StorefrontPaymentResultPageClient } from '@/components/storefront/payment/storefront-payment-result-page-client';

export default function PaymentResultPage() {
  return (
    <Suspense fallback={null}>
      <StorefrontPaymentResultPageClient />
    </Suspense>
  );
}
