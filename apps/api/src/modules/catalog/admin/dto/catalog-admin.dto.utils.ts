export function trimText(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function normalizeSlug(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function normalizeProductCode(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

export function normalizeUrl(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function normalizeOptionalUrl(value: unknown): string | undefined | unknown {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim();

  return normalizedValue || undefined;
}

export function normalizeNullableUrl(value: unknown): string | null | unknown {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim();

  return normalizedValue || null;
}
