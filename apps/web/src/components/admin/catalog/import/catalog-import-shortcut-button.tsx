'use client';

import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CatalogImportShortcutButton() {
  const router = useRouter();

  return (
    <Button
      type='button'
      variant='outline'
      iconStart={<FileUp className='size-4' />}
      onClick={() => {
        router.push('/admin/catalog/import');
      }}
    >
      ورود گروهی
    </Button>
  );
}
