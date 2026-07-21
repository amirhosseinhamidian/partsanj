import { localizeApiMessage } from '@/lib/api/localize-api-message';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly requestId?: string,
  ) {
    super(localizeApiMessage(message, status));
    this.name = 'ApiRequestError';
  }
}
