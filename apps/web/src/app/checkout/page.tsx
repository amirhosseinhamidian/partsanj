import type { Metadata } from 'next';

import { StorefrontCheckoutPageClient } from '@/components/storefront/checkout/storefront-checkout-page-client';
import { createPrivatePageMetadata } from '@/lib/storefront/seo/private-page-metadata';

export const metadata: Metadata = createPrivatePageMetadata(
  'تکمیل خرید',
  'ثبت اطلاعات ارسال و ادامه فرایند پرداخت سفارش',
);

export default function CheckoutPage() {
  return <StorefrontCheckoutPageClient />;
}
