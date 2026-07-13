import { describe, expect, it } from '@jest/globals';

import {
  generateOrderNumber,
  ORDER_NUMBER_MAX_EXCLUSIVE,
  ORDER_NUMBER_MIN,
} from './order-number.utils.js';

describe('order number utilities', () => {
  it('generates a six-digit order number in the allowed range', () => {
    for (let index = 0; index < 100; index += 1) {
      const orderNumber = generateOrderNumber();

      expect(Number.isInteger(orderNumber)).toBe(true);
      expect(orderNumber).toBeGreaterThanOrEqual(ORDER_NUMBER_MIN);
      expect(orderNumber).toBeLessThan(ORDER_NUMBER_MAX_EXCLUSIVE);
      expect(orderNumber.toString()).toHaveLength(6);
    }
  });
});
