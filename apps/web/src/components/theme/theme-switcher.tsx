'use client';

import { Button } from '@/components/ui/button';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { useEffect, useState } from 'react';

type ThemeOption = {
  value: 'light' | 'dark' | 'system';
  label: string;
  icon: LucideIcon;
};

const options: ThemeOption[] = [
  {
    value: 'light',
    label: 'روشن',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'تیره',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'سیستم',
    icon: Monitor,
  },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        aria-hidden='true'
        className='h-10 w-40 rounded-control border border-border bg-surface'
      />
    );
  }

  return (
    <div
      role='group'
      aria-label='انتخاب حالت نمایش'
      className='inline-flex rounded-control border border-border bg-surface p-1 shadow-panel'
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <Button
            key={option.value}
            type='button'
            size='sm'
            variant={isActive ? 'primary' : 'ghost'}
            iconStart={<Icon />}
            onClick={() => setTheme(option.value)}
            className='mr-0.5 ml-0.5 h-8 rounded-[9px] px-2.5 text-xs sm:px-3'
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
