import { digitsOnly } from '@/lib/utils/digits';

export { toLatinDigits } from '@/lib/utils/digits';

export function normalizeIranianMobile(value: string): string | null {
  const digits = digitsOnly(value);

  if (/^09\d{9}$/.test(digits)) {
    return digits;
  }

  if (/^989\d{9}$/.test(digits)) {
    return `0${digits.slice(2)}`;
  }

  if (/^9\d{9}$/.test(digits)) {
    return `0${digits}`;
  }

  return null;
}

export function normalizeOtp(value: string): string {
  return digitsOnly(value).slice(0, 4);
}
