export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export type PutStorageObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export interface StorageProvider {
  putObject(input: PutStorageObjectInput): Promise<void>;

  deleteObject(key: string): Promise<void>;

  getPublicUrl(key: string): string;
}
