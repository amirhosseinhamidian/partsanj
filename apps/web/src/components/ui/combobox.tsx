'use client';

import { cn } from '@/lib/utils/cn';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronDown, LoaderCircle, Search, X } from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ForwardedRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

const comboboxSizeClasses = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-3.5 text-sm',
  lg: 'h-12 px-4 text-sm',
} as const;

type ComboboxSize = keyof typeof comboboxSizeClasses;

export type ComboboxOption = {
  value: string;
  label: string;

  description?: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;

  keywords?: string[];
  disabled?: boolean;
  className?: string;
};

type ComboboxRenderState = {
  isSelected: boolean;
  isActive: boolean;
};

export type ComboboxProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'value' | 'defaultValue' | 'onChange' | 'size'
> & {
  name?: string;

  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;

  options: readonly ComboboxOption[];

  label?: ReactNode;
  helperText?: ReactNode;
  error?: string;

  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: ReactNode;
  loadingMessage?: ReactNode;

  startIcon?: ReactNode;

  size?: ComboboxSize;
  required?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  filterOptions?: boolean;

  loading?: boolean;

  onSearchChange?: (search: string) => void;
  onOpenChange?: (open: boolean) => void;

  wrapperClassName?: string;
  contentClassName?: string;
  optionClassName?: string;

  renderOption?: (option: ComboboxOption, state: ComboboxRenderState) => ReactNode;
};

function normalizeSearchText(value: string): string {
  return value
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('fa-IR');
}

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

function getFirstEnabledIndex(options: readonly ComboboxOption[]): number {
  return options.findIndex((option) => !option.disabled);
}

function getNextEnabledIndex(
  options: readonly ComboboxOption[],
  currentIndex: number,
  direction: 1 | -1,
): number {
  if (!options.length) {
    return -1;
  }

  let nextIndex = currentIndex;

  for (let step = 0; step < options.length; step += 1) {
    nextIndex = (nextIndex + direction + options.length) % options.length;

    if (!options[nextIndex]?.disabled) {
      return nextIndex;
    }
  }

  return -1;
}

export const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(function Combobox(
  {
    id,
    name,
    value,
    defaultValue = '',
    onValueChange,
    options,
    label,
    helperText,
    error,
    placeholder = 'انتخاب کنید',
    searchPlaceholder = 'جستجو کنید',
    emptyMessage = 'موردی پیدا نشد',
    loadingMessage = 'در حال دریافت اطلاعات...',
    startIcon,
    size = 'md',
    required = false,
    clearable = false,
    searchable = true,
    filterOptions = true,
    loading = false,
    disabled = false,
    className,
    wrapperClassName,
    contentClassName,
    optionClassName,
    renderOption,
    onSearchChange,
    onOpenChange,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    type,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const comboboxId = id ?? generatedId;

  const messageId = error || helperText ? `${comboboxId}-message` : undefined;

  const contentId = `${comboboxId}-options`;

  const [internalValue, setInternalValue] = useState(defaultValue);

  const [internalOpen, setInternalOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalValue;

  const selectedOption = options.find((option) => option.value === selectedValue);

  const normalizedSearch = normalizeSearchText(search);

  const filteredOptions = useMemo(() => {
    if (!filterOptions || !normalizedSearch) {
      return options;
    }

    return options.filter((option) => {
      const searchableText = [option.label, ...(option.keywords ?? [])].join(' ');

      return normalizeSearchText(searchableText).includes(normalizedSearch);
    });
  }, [filterOptions, normalizedSearch, options]);

  const canClear = clearable && Boolean(selectedValue) && !disabled;

  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(' ') || undefined;

  function handleOpenChange(nextOpen: boolean) {
    setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);

    if (!nextOpen) {
      setSearch('');
      onSearchChange?.('');
      setActiveIndex(-1);
      return;
    }

    const selectedIndex = options.findIndex(
      (option) => option.value === selectedValue && !option.disabled,
    );

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : getFirstEnabledIndex(options));
  }

  function handleValueChange(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function handleSelect(option: ComboboxOption) {
    if (option.disabled) {
      return;
    }

    handleValueChange(option.value);
    handleOpenChange(false);

    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }

  function handleClear() {
    handleValueChange('');

    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }

  function handleSearchChange(nextSearch: string) {
    setSearch(nextSearch);
    onSearchChange?.(nextSearch);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();

      setActiveIndex((current) =>
        getNextEnabledIndex(filteredOptions, current < 0 ? -1 : current, 1),
      );

      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      const fallbackIndex = activeIndex < 0 ? 0 : activeIndex;

      setActiveIndex((current) =>
        getNextEnabledIndex(filteredOptions, current < 0 ? fallbackIndex : current, -1),
      );

      return;
    }

    if (event.key === 'Enter') {
      const activeOption = filteredOptions[activeIndex];

      if (activeOption && !activeOption.disabled) {
        event.preventDefault();
        handleSelect(activeOption);
      }

      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      handleOpenChange(false);

      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }

  useEffect(() => {
    if (!internalOpen) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      if (searchable) {
        searchInputRef.current?.focus();
        return;
      }

      const activeOption = filteredOptions[activeIndex];

      if (activeOption) {
        optionRefs.current[activeOption.value]?.focus();
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [internalOpen, searchable]);

  useEffect(() => {
    if (!internalOpen) {
      return;
    }

    const selectedIndex = filteredOptions.findIndex(
      (option) => option.value === selectedValue && !option.disabled,
    );

    const firstEnabledIndex = getFirstEnabledIndex(filteredOptions);

    setActiveIndex((current) => {
      const currentOption = filteredOptions[current];

      if (currentOption && !currentOption.disabled) {
        return current;
      }

      return selectedIndex >= 0 ? selectedIndex : firstEnabledIndex;
    });
  }, [filteredOptions, internalOpen, selectedValue]);

  useEffect(() => {
    const activeOption = filteredOptions[activeIndex];

    if (!internalOpen || !activeOption) {
      return;
    }

    optionRefs.current[activeOption.value]?.scrollIntoView({
      block: 'nearest',
    });
  }, [activeIndex, filteredOptions, internalOpen]);

  return (
    <div dir='rtl' className={cn('w-full space-y-1.5', wrapperClassName)}>
      {label ? (
        <label htmlFor={comboboxId} className='block text-sm font-semibold text-foreground'>
          {label}

          {required ? (
            <span aria-hidden='true' className='ms-1 text-danger'>
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {name ? <input type='hidden' name={name} value={selectedValue} disabled={disabled} /> : null}

      <PopoverPrimitive.Root open={internalOpen} onOpenChange={handleOpenChange}>
        <div className='relative'>
          <PopoverPrimitive.Trigger asChild>
            <button
              {...props}
              ref={(element) => {
                triggerRef.current = element;
                assignRef(ref, element);
              }}
              id={comboboxId}
              type={type ?? 'button'}
              disabled={disabled}
              aria-required={required || undefined}
              aria-invalid={ariaInvalid ?? Boolean(error)}
              aria-describedby={describedBy}
              aria-controls={contentId}
              aria-haspopup='listbox'
              className={cn(
                'group flex w-full items-center gap-3 rounded-control border bg-surface text-right text-foreground outline-none',
                'transition-[background-color,border-color,box-shadow,color]',
                'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted',
                'focus:border-brand focus:shadow-panel focus:ring-2 focus:ring-focus-ring',
                'data-[state=open]:border-brand data-[state=open]:shadow-panel data-[state=open]:ring-2 data-[state=open]:ring-focus-ring',
                error
                  ? 'border-danger bg-danger-soft focus:border-danger focus:ring-danger/20 data-[state=open]:border-danger data-[state=open]:ring-danger/20'
                  : 'border-border hover:border-border-strong',
                comboboxSizeClasses[size],
                canClear && 'pe-3',
                className,
              )}
            >
              {startIcon ? (
                <span
                  aria-hidden='true'
                  className='grid size-5 shrink-0 place-items-center text-foreground-muted [&>svg]:size-5'
                >
                  {startIcon}
                </span>
              ) : null}

              <span
                className={cn(
                  'min-w-0 flex-1 truncate',
                  !selectedOption && 'text-foreground-muted',
                )}
              >
                {selectedOption?.label ?? placeholder}
              </span>

              <ChevronDown
                aria-hidden='true'
                className={cn(
                  'size-4 shrink-0 text-foreground-muted transition-transform duration-200',
                  internalOpen && 'rotate-180',
                  canClear && 'me-7',
                )}
              />
            </button>
          </PopoverPrimitive.Trigger>

          {canClear ? (
            <button
              type='button'
              aria-label='پاک کردن انتخاب'
              onClick={handleClear}
              className='absolute inset-e-3 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none'
            >
              <X className='size-3.5' />
            </button>
          ) : null}
        </div>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            id={contentId}
            dir='rtl'
            align='start'
            side='bottom'
            sideOffset={8}
            collisionPadding={12}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
            }}
            className={cn(
              'z-90 max-h-80 min-w-(--radix-popover-trigger-width) overflow-hidden rounded-card border border-border bg-surface-elevated shadow-floating outline-none',
              contentClassName,
            )}
          >
            {searchable ? (
              <div className='relative border-b border-border p-2.5'>
                <Search
                  aria-hidden='true'
                  className='pointer-events-none absolute inset-s-5 top-1/2 size-4 -translate-y-1/2 text-foreground-muted'
                />

                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className='h-10 w-full rounded-[10px] border border-transparent bg-surface-muted ps-9 pe-3 text-sm text-foreground transition-[background-color,border-color,box-shadow] outline-none placeholder:text-foreground-muted focus:border-brand focus:bg-surface focus:ring-2 focus:ring-focus-ring'
                />
              </div>
            ) : null}

            <div
              role='listbox'
              aria-label={typeof label === 'string' ? label : placeholder}
              className='max-h-60 overflow-y-auto p-1.5'
            >
              {loading ? (
                <div className='flex min-h-28 items-center justify-center gap-2 text-sm text-foreground-muted'>
                  <LoaderCircle className='size-4 animate-spin' />
                  <span>{loadingMessage}</span>
                </div>
              ) : filteredOptions.length ? (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === selectedValue;

                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={option.value}
                      ref={(element) => {
                        optionRefs.current[option.value] = element;
                      }}
                      type='button'
                      role='option'
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        'relative flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 pe-10 text-right text-sm text-foreground outline-none select-none',
                        'transition-[background-color,border-color,box-shadow,color]',
                        'focus-visible:ring-2 focus-visible:ring-focus-ring',
                        'disabled:pointer-events-none disabled:opacity-45',
                        isActive && 'bg-surface-muted',
                        isSelected && 'bg-brand-soft text-brand',
                        optionClassName,
                        option.className,
                      )}
                    >
                      {renderOption ? (
                        renderOption(option, {
                          isSelected,
                          isActive,
                        })
                      ) : (
                        <>
                          {option.icon ? (
                            <span
                              aria-hidden='true'
                              className='grid size-8 shrink-0 place-items-center rounded-[9px] bg-surface-muted text-foreground-secondary [&>svg]:size-4'
                            >
                              {option.icon}
                            </span>
                          ) : null}

                          <span className='min-w-0 flex-1'>
                            <span className='block truncate font-semibold'>{option.label}</span>

                            {option.description ? (
                              <span className='mt-0.5 block truncate text-xs font-normal text-foreground-muted'>
                                {option.description}
                              </span>
                            ) : null}
                          </span>

                          {option.meta ? (
                            <span className='shrink-0 text-xs font-medium text-foreground-muted'>
                              {option.meta}
                            </span>
                          ) : null}
                        </>
                      )}

                      {isSelected ? (
                        <span className='absolute inset-e-3 grid size-5 place-items-center text-brand'>
                          <Check className='size-4' />
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className='flex min-h-28 items-center justify-center px-4 text-center text-sm text-foreground-muted'>
                  {emptyMessage}
                </div>
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {error ? (
        <p id={messageId} role='alert' className='text-xs font-medium text-danger'>
          {error}
        </p>
      ) : helperText ? (
        <p id={messageId} className='text-xs text-foreground-muted'>
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Combobox.displayName = 'Combobox';
