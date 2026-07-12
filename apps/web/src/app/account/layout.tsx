import type { Metadata } from 'next';
import { AccountNavigation } from '@/components/storefront/account/account-navigation';
import type { ReactNode } from 'react';

import { createPrivatePageMetadata } from '@/lib/storefront/seo/private-page-metadata';

export const metadata: Metadata = createPrivatePageMetadata(
  'حساب کاربری',
  'مدیریت حساب کاربری، سفارش‌ها، آدرس‌ها و خودروهای شما',
);

type AccountLayoutProps = {
  children: ReactNode;
};

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <main className='w-full [--account-header-offset:4.5rem] lg:[--account-header-offset:5.6rem]'>
      <div className='sticky top-[var(--account-header-offset)] z-30 border-y border-border bg-surface/95 backdrop-blur lg:hidden'>
        <div className='mx-auto w-full max-w-7xl px-4 py-3 sm:px-6'>
          <AccountNavigation variant='mobile' />
        </div>
      </div>

      <div className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <div className='lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-6'>
          <aside className='hidden lg:sticky lg:top-[calc(var(--account-header-offset)+1rem)] lg:block lg:self-start'>
            <AccountNavigation variant='desktop' />
          </aside>

          <div className='min-w-0'>{children}</div>
        </div>
      </div>
    </main>
  );
}
