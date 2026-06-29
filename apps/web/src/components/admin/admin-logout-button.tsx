'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/toast-provider';
import { webApi } from '@/lib/api/web-client';
import { cn } from '@/lib/utils/cn';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type AdminLogoutButtonProps = {
  className?: string;
  showLabel?: boolean;
};

export function AdminLogoutButton({ className, showLabel = true }: AdminLogoutButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      await webApi.logout('admin');

      router.replace('/admin/login');
      router.refresh();
    } catch (error) {
      toast({
        variant: 'danger',
        title: 'خروج از حساب انجام نشد',
        description: error instanceof Error ? error.message : 'لطفاً دوباره تلاش کنید',
      });

      setIsPending(false);
    }
  }

  return (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      iconStart={<LogOut />}
      isLoading={isPending}
      aria-label='خروج از حساب'
      onClick={handleLogout}
      className={cn(className)}
    >
      {showLabel ? 'خروج از حساب' : <span className='sr-only'>خروج از حساب</span>}
    </Button>
  );
}
