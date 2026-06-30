export const buttonBaseClasses = [
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap',
  'rounded-control font-semibold',
  'transition duration-200 ease-out cursor-pointer',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-focus-ring focus-visible:ring-offset-2',
  'focus-visible:ring-offset-background',
  'disabled:pointer-events-none disabled:opacity-50',
  'active:translate-y-px motion-reduce:transform-none',
].join(' ');

export const buttonVariantClasses = {
  primary: [
    'border border-transparent',
    'bg-brand text-brand-foreground',
    'hover:bg-brand-hover active:bg-brand-active',
  ].join(' '),

  secondary: [
    'border border-border',
    'bg-surface-elevated text-foreground',
    'hover:border-border-strong hover:bg-surface-muted',
  ].join(' '),

  outline: [
    'border border-border',
    'bg-transparent text-foreground',
    'hover:border-border-strong hover:bg-surface-muted',
  ].join(' '),

  ghost: [
    'border border-transparent',
    'bg-transparent text-foreground-secondary',
    'hover:bg-surface-muted hover:text-foreground',
  ].join(' '),

  danger: [
    'border border-danger/40',
    'bg-danger-soft text-danger',
    'hover:border-danger hover:bg-danger-soft',
  ].join(' '),
} as const;

export const buttonSizeClasses = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
} as const;

export const iconButtonSizeClasses = {
  sm: 'size-9',
  md: 'size-11',
  lg: 'size-12',
} as const;

export const iconGlyphSizeClasses = {
  sm: '[&>svg]:size-4',
  md: '[&>svg]:size-5',
  lg: '[&>svg]:size-5',
} as const;

export type ButtonVariant = keyof typeof buttonVariantClasses;
export type ButtonSize = keyof typeof buttonSizeClasses;
export type IconButtonSize = keyof typeof iconButtonSizeClasses;
