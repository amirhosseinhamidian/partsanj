type UnknownRecord = Record<string, unknown>;

export type AdminInteractionImportType = 'REVIEW' | 'QUESTION';

export type AdminInteractionImportSource = 'INSTAGRAM' | 'WHATSAPP' | 'PHONE' | 'LEGACY';

export type AdminInteractionImportPreviewRow = {
  rowNumber: number;

  type: string | null;

  productSku: string | null;

  productSlug: string | null;

  authorDisplayName: string | null;

  rating: number | null;

  body: string | null;

  adminReply: string | null;

  source: string | null;

  sourceReference: string | null;

  sourceCreatedAt: string | null;

  valid: boolean;

  duplicate: boolean;

  errors: string[];
};

export type AdminInteractionImportPreview = {
  valid: boolean;

  totalRows: number;

  validRows: number;

  invalidRows: number;

  duplicateRows: number;

  rows: AdminInteractionImportPreviewRow[];
};

export type AdminInteractionImportPreviewResponse = {
  data: unknown;

  message?: string;
};

export type AdminInteractionImportResult = {
  importedRows: number;

  reviews: number;

  questions: number;

  replies: number;
};

export type AdminInteractionImportResponse = {
  data: unknown;

  message?: string;
};

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function readString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readNumber(record: UnknownRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readBoolean(record: UnknownRecord, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'boolean') {
      return value;
    }
  }

  return null;
}

function readArray(record: UnknownRecord, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function normalizeErrors(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      const record = asRecord(item);

      if (!record) {
        return '';
      }

      return readString(record, ['message', 'error', 'reason']) ?? '';
    })
    .filter(Boolean);
}

function normalizeRow(value: unknown, index: number): AdminInteractionImportPreviewRow {
  const original = asRecord(value) ?? {};

  const nested =
    asRecord(original.data) ?? asRecord(original.row) ?? asRecord(original.normalized) ?? {};

  const record = {
    ...original,
    ...nested,
  };

  const errors = normalizeErrors(original.errors ?? original.validationErrors ?? original.error);

  const status = readString(original, ['status'])?.toUpperCase();

  const duplicate =
    (readBoolean(original, ['duplicate', 'isDuplicate']) ?? status === 'DUPLICATE') ||
    errors.some((error) => error.toLowerCase().includes('duplicate'));

  const explicitValid = readBoolean(original, ['valid', 'isValid']);

  const valid = explicitValid ?? (status ? status === 'VALID' : errors.length === 0 && !duplicate);

  return {
    rowNumber: readNumber(original, ['rowNumber', 'row', 'line', 'index']) ?? index + 2,

    type: readString(record, ['type']),

    productSku: readString(record, ['productSku', 'sku']),

    productSlug: readString(record, ['productSlug', 'slug']),

    authorDisplayName: readString(record, ['authorDisplayName', 'author']),

    rating: readNumber(record, ['rating']),

    body: readString(record, ['body']),

    adminReply: readString(record, ['adminReply']),

    source: readString(record, ['source']),

    sourceReference: readString(record, ['sourceReference']),

    sourceCreatedAt: readString(record, ['sourceCreatedAt']),

    valid,

    duplicate,

    errors,
  };
}

export function normalizeAdminInteractionImportPreview(
  payload: unknown,
): AdminInteractionImportPreview {
  const root = asRecord(payload) ?? {};

  const data = asRecord(root.data) ?? root;

  const summary = asRecord(data.summary) ?? {};

  const rawRows = readArray(data, ['rows', 'items', 'preview', 'results']);

  const rows = rawRows.map(normalizeRow);

  const derivedValidRows = rows.filter((row) => row.valid).length;

  const derivedInvalidRows = rows.filter((row) => !row.valid).length;

  const derivedDuplicateRows = rows.filter((row) => row.duplicate).length;

  const totalRows =
    readNumber(data, ['totalRows', 'total']) ??
    readNumber(summary, ['totalRows', 'total']) ??
    rows.length;

  const validRows =
    readNumber(data, ['validRows', 'validCount']) ??
    readNumber(summary, ['validRows', 'validCount']) ??
    derivedValidRows;

  const invalidRows =
    readNumber(data, ['invalidRows', 'invalidCount']) ??
    readNumber(summary, ['invalidRows', 'invalidCount']) ??
    derivedInvalidRows;

  const duplicateRows =
    readNumber(data, ['duplicateRows', 'duplicateCount']) ??
    readNumber(summary, ['duplicateRows', 'duplicateCount']) ??
    derivedDuplicateRows;

  const explicitValid = readBoolean(data, ['valid', 'isValid', 'canImport']);

  return {
    valid: explicitValid ?? (totalRows > 0 && invalidRows === 0 && duplicateRows === 0),

    totalRows,

    validRows,

    invalidRows,

    duplicateRows,

    rows,
  };
}

export function normalizeAdminInteractionImportResult(
  payload: unknown,
): AdminInteractionImportResult {
  const root = asRecord(payload) ?? {};

  const data = asRecord(root.data) ?? root;

  const summary = asRecord(data.summary) ?? {};

  return {
    importedRows:
      readNumber(data, ['importedRows', 'imported', 'created', 'total']) ??
      readNumber(summary, ['importedRows', 'imported', 'created', 'total']) ??
      0,

    reviews:
      readNumber(data, ['reviews', 'reviewsCount']) ??
      readNumber(summary, ['reviews', 'reviewsCount']) ??
      0,

    questions:
      readNumber(data, ['questions', 'questionsCount']) ??
      readNumber(summary, ['questions', 'questionsCount']) ??
      0,

    replies:
      readNumber(data, ['replies', 'repliesCount']) ??
      readNumber(summary, ['replies', 'repliesCount']) ??
      0,
  };
}
