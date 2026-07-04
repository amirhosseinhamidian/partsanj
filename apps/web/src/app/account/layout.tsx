import type { ReactNode } from 'react';

type AccountLayoutProps = {
  children: ReactNode;
};

export default function AccountLayout({ children }: AccountLayoutProps) {
  return <main className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>{children}</main>;
}
