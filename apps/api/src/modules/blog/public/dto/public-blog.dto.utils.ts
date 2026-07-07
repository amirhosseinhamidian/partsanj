export function normalizeOptionalText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

export function normalizeSlugParam(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toLowerCase();
}
