import 'server-only';

import type { Metadata } from 'next';

import { buildSeoMetadata } from './seo-metadata';

export function createPrivatePageMetadata(title: string, description?: string): Metadata {
  return buildSeoMetadata({
    title,
    description,
    privatePage: true,
  });
}
