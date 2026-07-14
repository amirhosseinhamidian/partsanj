import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  runWithTimeoutSignal,
  UpstreamRequestTimeoutError,
} from './request-timeout.js';

describe('runWithTimeoutSignal', () => {
  it('returns the operation result before timeout', async () => {
    await expect(
      runWithTimeoutSignal(
        {
          timeoutMs: 100,
        },
        async () => 'ok',
      ),
    ).resolves.toBe('ok');
  });

  it('throws a typed timeout error', async () => {
    await expect(
      runWithTimeoutSignal(
        {
          timeoutMs: 10,
        },
        (signal) =>
          new Promise<never>(
            (_resolve, reject) => {
              signal.addEventListener(
                'abort',
                () => reject(signal.reason),
                {
                  once: true,
                },
              );
            },
          ),
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'UpstreamRequestTimeoutError',
        timeoutMs: 10,
      }),
    );
  });

  it('preserves caller cancellation', async () => {
    const parentController =
      new AbortController();

    const callerReason =
      new Error('caller cancelled');

    const operation =
      runWithTimeoutSignal(
        {
          timeoutMs: 1_000,
          signal:
            parentController.signal,
        },
        (signal) =>
          new Promise<never>(
            (_resolve, reject) => {
              signal.addEventListener(
                'abort',
                () =>
                  reject(signal.reason),
                {
                  once: true,
                },
              );
            },
          ),
      );

    parentController.abort(
      callerReason,
    );

    await expect(operation).rejects.toBe(
      callerReason,
    );

    await expect(
      operation,
    ).rejects.not.toBeInstanceOf(
      UpstreamRequestTimeoutError,
    );
  });
});
