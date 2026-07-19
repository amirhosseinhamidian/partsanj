export type AdminUploadPurpose =
  | 'products'
  | 'blog'
  | 'categories'
  | 'brands'
  | 'vehicles'
  | 'general';

export type AdminUploadedImage = {
  id: string;
  purpose: AdminUploadPurpose;

  key: string;
  url: string;

  thumbnailKey: string;
  thumbnailUrl: string;

  originalName: string;
  sourceMimeType: string;
  mimeType: 'image/webp';

  originalSizeBytes: number;
  sizeBytes: number;
  width: number;
  height: number;

  thumbnailSizeBytes: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
};

export type AdminUploadImageResponse = {
  data: AdminUploadedImage;
};
