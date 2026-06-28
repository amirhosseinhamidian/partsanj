import { getCurrentAdmin } from '@/lib/auth/current-admin';
import { redirect } from 'next/navigation';

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <div dir='rtl' className='min-h-screen bg-zinc-100'>
      <header className='border-b border-zinc-200 bg-white px-6 py-4'>
        <div className='mx-auto flex max-w-7xl items-center justify-between'>
          <div>
            <p className='text-lg font-bold text-zinc-950'>PartSanj Admin</p>
            <p className='text-sm text-zinc-500'>{admin.fullName ?? admin.phone ?? admin.id}</p>
          </div>

          <span className='rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700'>
            {admin.role}
          </span>
        </div>
      </header>

      <main className='mx-auto max-w-7xl p-6'>{children}</main>
    </div>
  );
}
