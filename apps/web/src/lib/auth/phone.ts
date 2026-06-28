const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

export function normalizeIranianMobile(value: string): string | null {
  const digits = toLatinDigits(value).replace(/\D/g, '');

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
  return toLatinDigits(value).replace(/\D/g, '').slice(0, 8);
}
