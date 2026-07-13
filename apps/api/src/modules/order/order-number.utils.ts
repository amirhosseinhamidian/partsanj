import { randomInt } from 'node:crypto';

import { Prisma } from '../../generated/prisma/client.js';

export const ORDER_NUMBER_MIN = 100_001;
export const ORDER_NUMBER_MAX_EXCLUSIVE = 1_000_000;
export const ORDER_NUMBER_MAX_ATTEMPTS = 5;

/**
 * Generates a six-digit public order number.
 *
 * Possible range:
 * 100001 ... 999999
 */
export function generateOrderNumber(): number {
  return randomInt(ORDER_NUMBER_MIN, ORDER_NUMBER_MAX_EXCLUSIVE);
}

/**
 * Detects a unique-constraint collision specifically for orderNumber.
 */
export function isOrderNumberCollision(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }

  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.some((field) => typeof field === 'string' && field.includes('orderNumber'));
  }

  return typeof target === 'string' && target.includes('orderNumber');
}
