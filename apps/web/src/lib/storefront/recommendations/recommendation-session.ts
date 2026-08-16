'use client';

const SESSION_ID_KEY = 'partsanj:recommendation-session-id';

const LAST_ACTIVITY_KEY = 'partsanj:recommendation-last-activity';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function createUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);

  crypto.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

export function getRecommendationSessionId(): string {
  const now = Date.now();

  const storedSessionId = localStorage.getItem(SESSION_ID_KEY);

  const lastActivityValue = localStorage.getItem(LAST_ACTIVITY_KEY);

  const lastActivity = Number(lastActivityValue);

  const isActiveSession =
    Boolean(storedSessionId) &&
    Number.isFinite(lastActivity) &&
    now - lastActivity < SESSION_TIMEOUT_MS;

  const sessionId = isActiveSession && storedSessionId ? storedSessionId : createUuidV4();

  localStorage.setItem(SESSION_ID_KEY, sessionId);

  localStorage.setItem(LAST_ACTIVITY_KEY, String(now));

  return sessionId;
}

function getTrackedViewKey(sessionId: string, productId: string) {
  return ['partsanj', 'view', sessionId, productId].join(':');
}

export function hasTrackedProductView(sessionId: string, productId: string): boolean {
  return sessionStorage.getItem(getTrackedViewKey(sessionId, productId)) === '1';
}

export function markProductViewTracked(sessionId: string, productId: string): void {
  sessionStorage.setItem(getTrackedViewKey(sessionId, productId), '1');
}
