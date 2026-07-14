import { AsyncLocalStorage } from 'node:async_hooks';

type RequestContext = {
  requestId: string;
};

const requestContextStorage =
  new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(
  requestId: string,
  callback: () => T,
): T {
  return requestContextStorage.run(
    {
      requestId,
    },
    callback,
  );
}

export function getRequestId(): string | undefined {
  return requestContextStorage.getStore()?.requestId;
}
