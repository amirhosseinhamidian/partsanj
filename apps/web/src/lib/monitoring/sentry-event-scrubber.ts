type MutableSentryEvent = {
  request?: {
    url?: string;
    headers?: unknown;
    cookies?: unknown;
    data?: unknown;
    query_string?: unknown;
    env?: unknown;
  };
  user?: {
    id?: string | number;
    [key: string]: unknown;
  };
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
};

function stripQueryAndHash(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value, 'http://partsanj.local');
    url.search = '';
    url.hash = '';

    if (/^https?:\/\//i.test(value)) {
      return url.toString();
    }

    return url.pathname;
  } catch {
    return value.split(/[?#]/, 1)[0] || undefined;
  }
}

export function scrubSentryEvent<T extends MutableSentryEvent>(event: T): T {
  if (event.request) {
    event.request.url = stripQueryAndHash(event.request.url);

    delete event.request.headers;
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
    delete event.request.env;
  }

  if (event.user?.id !== undefined) {
    event.user = {
      id: String(event.user.id),
    };
  } else {
    delete event.user;
  }

  return event;
}
