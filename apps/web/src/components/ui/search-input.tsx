'use client';

import { cn } from '@/lib/utils/cn';
import { LoaderCircle, Search, X } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

const searchInputSizeClasses = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-3.5 text-sm',
  lg: 'h-12 px-4 text-sm',
} as const;

type SearchInputSize = keyof typeof searchInputSizeClasses;

export type SearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'size'
> & {
  value?: string;
  defaultValue?: string;

  onValueChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  onClear?: () => void;

  label?: ReactNode;
  helperText?: ReactNode;
  error?: string;

  size?: SearchInputSize;
  debounceMs?: number;
  minLength?: number;

  loading?: boolean;
  clearable?: boolean;
  searchOnEnter?: boolean;

  wrapperClassName?: string;
  inputClassName?: string;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    id,
    value,
    defaultValue = '',
    onValueChange,
    onSearch,
    onClear,
    label,
    helperText,
    error,
    size = 'md',
    debounceMs = 350,
    minLength = 0,
    loading = false,
    clearable = true,
    searchOnEnter = true,
    wrapperClassName,
    inputClassName,
    className,
    disabled,
    required,
    placeholder = 'جستجو کنید',
    dir = 'rtl',
    onKeyDown,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [internalValue, setInternalValue] = useState(defaultValue);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const didMountRef = useRef(false);
  const skipNextDebouncedSearchRef = useRef(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const messageId = error || helperText ? `${inputId}-message` : undefined;

  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(' ') || undefined;

  const canClear = clearable && Boolean(currentValue) && !disabled;

  const clearSearchTimer = useCallback(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, []);

  function canSearch(query: string): boolean {
    const normalizedQuery = query.trim();

    return normalizedQuery.length === 0 || normalizedQuery.length >= minLength;
  }

  function emitValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function runSearchImmediately(query: string) {
    const searchHandler = onSearchRef.current;

    if (!searchHandler || !canSearch(query)) {
      return;
    }

    clearSearchTimer();
    searchHandler(query.trim());
  }

  function handleClear() {
    skipNextDebouncedSearchRef.current = true;

    emitValue('');
    onClear?.();
    runSearchImmediately('');
  }

  const hasOnSearch = Boolean(onSearch);

  useEffect(() => {
    if (!hasOnSearch) {
      return;
    }

    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (skipNextDebouncedSearchRef.current) {
      skipNextDebouncedSearchRef.current = false;
      return;
    }

    const normalizedQuery = currentValue.trim();

    if (normalizedQuery.length > 0 && normalizedQuery.length < minLength) {
      clearSearchTimer();
      return;
    }

    clearSearchTimer();

    searchTimerRef.current = window.setTimeout(() => {
      onSearchRef.current?.(normalizedQuery);
      searchTimerRef.current = null;
    }, debounceMs);

    return clearSearchTimer;
  }, [clearSearchTimer, currentValue, debounceMs, hasOnSearch, minLength]);

  return (
    <div className={cn('w-full space-y-1.5', wrapperClassName)}>
      {label ? (
        <label htmlFor={inputId} className='block text-sm font-semibold text-foreground'>
          {label}

          {required ? (
            <span aria-hidden='true' className='ms-1 text-danger'>
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className='relative'>
        <Search
          aria-hidden='true'
          className='pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted'
        />

        <input
          {...props}
          ref={ref}
          id={inputId}
          type='text'
          role='searchbox'
          dir={dir}
          value={currentValue}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          aria-label={ariaLabel ?? (typeof label === 'string' ? label : 'جستجو')}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => {
            emitValue(event.target.value);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);

            if (event.defaultPrevented || event.key !== 'Enter' || !searchOnEnter) {
              return;
            }

            event.preventDefault();
            runSearchImmediately(currentValue);
          }}
          className={cn(
            'w-full rounded-control border bg-surface text-foreground outline-none',
            'ps-10',
            'placeholder:text-foreground-muted',
            'transition-[background-color,border-color,box-shadow,color]',
            'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted',
            'read-only:bg-surface-muted',
            'focus:border-brand focus:shadow-panel focus:ring-2 focus:ring-focus-ring',
            error
              ? 'border-danger bg-danger-soft focus:border-danger focus:ring-danger/20'
              : 'border-border hover:border-border-strong',
            (canClear || loading) && 'pe-10',
            searchInputSizeClasses[size],
            className,
            inputClassName,
          )}
        />

        {loading ? (
          <span
            aria-label='در حال جستجو'
            className='absolute inset-e-3 top-1/2 grid size-5 -translate-y-1/2 place-items-center text-foreground-muted'
          >
            <LoaderCircle className='size-4 animate-spin' />
          </span>
        ) : canClear ? (
          <button
            type='button'
            aria-label='پاک کردن عبارت جستجو'
            onClick={handleClear}
            className='absolute inset-e-3 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground focus:ring-2 focus:ring-focus-ring focus:outline-none'
          >
            <X className='size-3.5' />
          </button>
        ) : null}
      </div>

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

SearchInput.displayName = 'SearchInput';
