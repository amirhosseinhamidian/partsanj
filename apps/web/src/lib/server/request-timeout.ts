const DEFAULT_API_TIMEOUT_MS = 10_000;
const DEFAULT_PUBLIC_API_TIMEOUT_MS = 10_000;
const DEFAULT_PAYMENT_API_TIMEOUT_MS = 20_000;

type RunWithTimeoutSignalOptions = {
  timeoutMs: number;
  signal?: AbortSignal | null;
};

export class UpstreamRequestTimeoutError extends Error {
  constructor(
    public readonly timeoutMs: number,
  ) {
    super(
      `Upstream request timed out after ${timeoutMs}ms`,
    );

    this.name = 'UpstreamRequestTimeoutError';
  }
}

function resolvePositiveTimeout(
  value: string | undefined,
  fallback: number,
): number {
  const parsedValue = Number.parseInt(
    value?.trim() ?? '',
    10,
  );

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue <= 0
  ) {
    return fallback;
  }

  return parsedValue;
}

export const NEST_API_TIMEOUT_MS =
  resolvePositiveTimeout(
    process.env.PARTSANJ_API_TIMEOUT_MS,
    DEFAULT_API_TIMEOUT_MS,
  );

export const PUBLIC_NEST_API_TIMEOUT_MS =
  resolvePositiveTimeout(
    process.env.PARTSANJ_PUBLIC_API_TIMEOUT_MS,
    DEFAULT_PUBLIC_API_TIMEOUT_MS,
  );

export const PAYMENT_NEST_API_TIMEOUT_MS =
  resolvePositiveTimeout(
    process.env.PARTSANJ_PAYMENT_API_TIMEOUT_MS,
    DEFAULT_PAYMENT_API_TIMEOUT_MS,
  );

/**
 * عملیات را با AbortSignal محدودشده به timeout اجرا می‌کند.
 *
 * این helper هم زمان دریافت headers و هم خواندن response body را پوشش می‌دهد،
 * چون cleanup فقط بعد از اتمام کامل callback انجام می‌شود.
 *
 * اگر caller از قبل signal داشته باشد، لغو caller نیز حفظ می‌شود.
 */
export async function runWithTimeoutSignal<T>(
  options: RunWithTimeoutSignalOptions,
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const timeoutMs = Math.max(
    1,
    Math.trunc(options.timeoutMs),
  );

  const controller = new AbortController();
  const parentSignal = options.signal ?? undefined;

  let timedOut = false;

  const abortFromParent = () => {
    controller.abort(parentSignal?.reason);
  };

  if (parentSignal?.aborted) {
    abortFromParent();
  } else {
    parentSignal?.addEventListener(
      'abort',
      abortFromParent,
      {
        once: true,
      },
    );
  }

  const timer = setTimeout(() => {
    timedOut = true;

    controller.abort(
      new DOMException(
        `Request timed out after ${timeoutMs}ms`,
        'TimeoutError',
      ),
    );
  }, timeoutMs);

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (timedOut) {
      throw new UpstreamRequestTimeoutError(
        timeoutMs,
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);

    parentSignal?.removeEventListener(
      'abort',
      abortFromParent,
    );
  }
}
