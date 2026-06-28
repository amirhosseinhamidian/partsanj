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
