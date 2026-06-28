import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { OtpPurpose } from '../../generated/prisma/client.js';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

export function normalizeIranianMobile(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  let mobile = normalizeDigits(value)
    .trim()
    .replace(/[\s()-]/g, '');

  if (mobile.startsWith('+98')) {
    mobile = `0${mobile.slice(3)}`;
  } else if (mobile.startsWith('0098')) {
    mobile = `0${mobile.slice(4)}`;
  } else if (mobile.startsWith('98')) {
    mobile = `0${mobile.slice(2)}`;
  } else if (mobile.startsWith('9') && mobile.length === 10) {
    mobile = `0${mobile}`;
  }

  return mobile;
}

export function generateNumericOtp(length: number): string {
  const minimum = 10 ** (length - 1);
  const maximum = 10 ** length;

  return String(randomInt(minimum, maximum));
}

export function hashOtp(mobile: string, purpose: OtpPurpose, code: string, secret: string): string {
  return createHmac('sha256', secret).update(`${mobile}:${purpose}:${code}`).digest('hex');
}

export function otpHashesMatch(expectedHash: string, actualHash: string): boolean {
  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(actualHash, 'hex');

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export function parseJwtTtlToSeconds(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());

  if (!match) {
    throw new Error('JWT_ACCESS_TTL must use a format such as 15m, 1h, 7d, or 30s');
  }

  const amount = Number(match[1]);

  const multiplierByUnit = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  } as const;

  const unit = match[2] as keyof typeof multiplierByUnit;

  return amount * multiplierByUnit[unit];
}
