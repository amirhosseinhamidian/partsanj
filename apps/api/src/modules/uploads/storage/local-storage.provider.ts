import { randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { access, link, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PutStorageObjectInput, StorageProvider } from './storage-provider.js';

@Injectable()
export class LocalStorageProvider implements StorageProvider, OnModuleInit {
  private readonly publicDirectory: string;
  private readonly temporaryDirectory: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const configuredUploadDirectory = this.configService.get<string>('UPLOAD_DIR')?.trim();

    if (!configuredUploadDirectory) {
      throw new Error('UPLOAD_DIR environment variable is required');
    }

    const configuredPublicBaseUrl = this.configService
      .get<string>('UPLOAD_PUBLIC_BASE_URL')
      ?.trim();

    if (!configuredPublicBaseUrl) {
      throw new Error('UPLOAD_PUBLIC_BASE_URL environment variable is required');
    }

    this.validatePublicBaseUrl(configuredPublicBaseUrl);

    const uploadDirectory = resolve(configuredUploadDirectory);

    this.publicDirectory = resolve(uploadDirectory, 'public');
    this.temporaryDirectory = resolve(uploadDirectory, 'tmp');
    this.publicBaseUrl = configuredPublicBaseUrl.replace(/\/+$/, '');
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.publicDirectory, {
      recursive: true,
      mode: 0o755,
    });

    await mkdir(this.temporaryDirectory, {
      recursive: true,
      mode: 0o700,
    });

    await access(this.publicDirectory, fsConstants.R_OK | fsConstants.W_OK);
    await access(this.temporaryDirectory, fsConstants.R_OK | fsConstants.W_OK);
  }

  async putObject(input: PutStorageObjectInput): Promise<void> {
    const destinationPath = this.resolveObjectPath(input.key);

    await mkdir(dirname(destinationPath), {
      recursive: true,
      mode: 0o755,
    });

    const temporaryPath = resolve(this.temporaryDirectory, `${randomUUID()}.tmp`);

    await writeFile(temporaryPath, input.body, {
      flag: 'wx',
      mode: 0o644,
    });

    try {
      /*
       * Creating a hard link is atomic and fails when the destination
       * already exists. This prevents silent overwrites.
       */
      await link(temporaryPath, destinationPath);
    } finally {
      await rm(temporaryPath, {
        force: true,
      });
    }
  }

  async deleteObject(key: string): Promise<void> {
    const objectPath = this.resolveObjectPath(key);

    await rm(objectPath, {
      force: true,
    });
  }

  getPublicUrl(key: string): string {
    const normalizedKey = this.normalizeObjectKey(key);

    const encodedKey = normalizedKey
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    return `${this.publicBaseUrl}/${encodedKey}`;
  }

  private resolveObjectPath(key: string): string {
    const normalizedKey = this.normalizeObjectKey(key);
    const objectPath = resolve(this.publicDirectory, ...normalizedKey.split('/'));

    const relativePath = relative(this.publicDirectory, objectPath);

    if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
      throw new Error('Invalid storage object path');
    }

    return objectPath;
  }

  private normalizeObjectKey(key: string): string {
    const normalizedKey = key.replaceAll('\\', '/').trim();
    const segments = normalizedKey.split('/');

    if (
      !normalizedKey ||
      isAbsolute(normalizedKey) ||
      segments.some(
        (segment) =>
          !segment || segment === '.' || segment === '..' || !/^[a-zA-Z0-9._-]+$/.test(segment),
      )
    ) {
      throw new Error('Invalid storage object key');
    }

    return segments.join('/');
  }

  private validatePublicBaseUrl(value: string): void {
    const parsedUrl = new URL(value);

    if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.search || parsedUrl.hash) {
      throw new Error('UPLOAD_PUBLIC_BASE_URL is invalid');
    }
  }
}
