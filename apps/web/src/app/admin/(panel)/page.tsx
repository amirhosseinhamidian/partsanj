'use client';
import { IconButton } from '@/components/ui/icon-button';
import { PageHeader } from '@/components/ui/page-header';
import { Tooltip } from '@/components/ui/tooltip';
import { Bell, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { RadioGroup } from '@/components/ui/radio-group';

export default function AdminDashboardPage() {
  const [isActive, setIsActive] = useState(true);
  return (
    <div className='space-y-6'>
      <PageHeader
        variant='surface'
        title='داشبورد'
        description='نمای کلی وضعیت فروشگاه، سفارش‌ها و عملکرد عملیاتی'
        leading={<LayoutDashboard />}
      />

      <section className='rounded-card border border-border bg-surface p-6 shadow-panel'>
        <p className='type-body text-foreground-secondary'>
          اتصال Next.js به API و ورود OTP با موفقیت آماده شده است
        </p>
      </section>
      <Tooltip content='مشاهده اعلان‌ها'>
        <IconButton aria-label='مشاهده اعلان‌ها' icon={<Bell />} variant='outline' />
      </Tooltip>

      <Switch
        checked={isActive}
        onCheckedChange={setIsActive}
        label='نمایش در سایت'
        helperText='در صورت غیرفعال بودن، مشتری این دسته‌بندی را نمی‌بیند'
      />

      <RadioGroup
        label='وضعیت انتشار'
        name='status'
        required
        defaultValue='DRAFT'
        options={[
          {
            value: 'DRAFT',
            label: 'پیش‌نویس',
          },
          {
            value: 'ACTIVE',
            label: 'فعال',
          },
          {
            value: 'INACTIVE',
            label: 'غیرفعال',
          },
        ]}
      />
    </div>
  );
}
