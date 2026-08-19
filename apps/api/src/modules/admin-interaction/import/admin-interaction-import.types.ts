import { InteractionSource } from '../../../generated/prisma/client.js';

export type AdminInteractionImportType = 'REVIEW' | 'QUESTION';

export type AdminInteractionImportProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
};

export type AdminInteractionImportPreviewRow = {
  rowNumber: number;

  valid: boolean;
  duplicate: boolean;

  errors: string[];
  warnings: string[];

  type: AdminInteractionImportType | null;

  product: AdminInteractionImportProduct | null;

  authorDisplayName: string;

  rating: number | null;

  body: string | null;

  adminReply: string | null;

  source: InteractionSource | null;

  sourceReference: string | null;

  sourceCreatedAt: Date | null;
};

export type AdminInteractionCsvRow = {
  type?: string;

  productSku?: string;
  productSlug?: string;

  authorDisplayName?: string;

  rating?: string;

  body?: string;

  adminReply?: string;

  source?: string;

  sourceReference?: string;

  sourceCreatedAt?: string;
};
