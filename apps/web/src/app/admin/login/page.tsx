import { AdminLoginForm } from '@/components/auth/admin-login-form';

type AdminLoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    reason?: string | string[];
  }>;
};

function getSingleValue(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;

  const rawNext = getSingleValue(params.next);
  const reason = getSingleValue(params.reason);

  const nextPath = rawNext.startsWith('/admin') && !rawNext.startsWith('//') ? rawNext : '/admin';

  const initialMessage =
    reason === 'forbidden' ? 'این حساب اجازه ورود به پنل مدیریت را ندارد' : undefined;

  return (
    <main className='flex min-h-screen items-center justify-center bg-zinc-100 p-6'>
      <AdminLoginForm nextPath={nextPath} initialMessage={initialMessage} />
    </main>
  );
}
