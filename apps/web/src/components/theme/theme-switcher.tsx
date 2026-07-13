'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';

import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';

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
        className='h-10 w-29 rounded-control border border-border bg-transparent sm:w-40'
      />
    );
  }

  return (
    <div
      role='group'
      aria-label='انتخاب حالت نمایش'
      className='inline-flex rounded-control border border-border bg-transparent p-1 shadow-panel'
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
            iconStart={<Icon aria-hidden='true' />}
            aria-label={`حالت ${option.label}`}
            aria-pressed={isActive}
            title={`حالت ${option.label}`}
            onClick={() => setTheme(option.value)}
            className='mx-0.5 h-8 gap-0 rounded-[9px] px-2 sm:gap-2 sm:px-3'
          >
            <span className='hidden text-xs sm:inline'>{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
