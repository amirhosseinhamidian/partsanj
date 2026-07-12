import type { Metadata } from 'next';

import { StorefrontCartPageClient } from '@/components/storefront/cart/storefront-cart-page-client';
import { createPrivatePageMetadata } from '@/lib/storefront/seo/private-page-metadata';

export const metadata: Metadata = createPrivatePageMetadata(
  'سبد خرید',
  'مشاهده و مدیریت محصولات موجود در سبد خرید',
);

export default function CartPage() {
  return <StorefrontCartPageClient />;
}
