import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type KavenegarEntry = {
  messageid?: number | string;
};

type KavenegarResponse = {
  return?: {
    status?: number;
    message?: string;
  };
  entries?: KavenegarEntry | KavenegarEntry[];
};

export type SendLookupSmsInput = {
  recipient: string;
  template: string;
  token: string;
  token2?: string;
  token3?: string;
};

@Injectable()
export class KavenegarTransactionalSmsService {
  private readonly logger = new Logger(
    KavenegarTransactionalSmsService.name,
  );

  constructor(
    private readonly configService: ConfigService,
  ) {}

  async sendLookup(
    input: SendLookupSmsInput,
  ): Promise<{ providerMessageId?: string }> {
    const deliveryMode =
      this.resolveDeliveryMode();

    if (deliveryMode === 'CONSOLE') {
      this.logger.log({
        event: 'order_sms_console_delivery',
        recipient: this.maskMobile(input.recipient),
        template: input.template,
        token: input.token,
        token2: input.token2,
        token3: input.token3,
      });

      return {};
    }

    if (deliveryMode !== 'KAVENEGAR') {
      throw new Error(
        `Unsupported ORDER_SMS_DELIVERY_MODE: ${deliveryMode}`,
      );
    }

    const apiKey =
      this.configService.getOrThrow<string>(
        'KAVENEGAR_API_KEY',
      );

    const url = new URL(
      `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`,
    );

    url.searchParams.set(
      'receptor',
      input.recipient,
    );
    url.searchParams.set(
      'template',
      input.template,
    );
    url.searchParams.set('token', input.token);

    if (input.token2) {
      url.searchParams.set(
        'token2',
        input.token2,
      );
    }

    if (input.token3) {
      url.searchParams.set(
        'token3',
        input.token3,
      );
    }

    let response: Response;

    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      throw new Error(
        'Kavenegar transactional SMS request failed',
        {
          cause: error,
        },
      );
    }

    const payload = (await response
      .json()
      .catch(() => null)) as
      | KavenegarResponse
      | null;

    if (
      !response.ok ||
      payload?.return?.status !== 200
    ) {
      throw new Error(
        `Kavenegar lookup rejected: HTTP ${response.status}, provider status ${
          payload?.return?.status ?? 'unknown'
        }`,
      );
    }

    const entry = Array.isArray(
      payload.entries,
    )
      ? payload.entries[0]
      : payload.entries;

    return {
      providerMessageId:
        entry?.messageid !== undefined
          ? String(entry.messageid)
          : undefined,
    };
  }

  private resolveDeliveryMode(): string {
    const configured =
      this.configService
        .get<string>(
          'ORDER_SMS_DELIVERY_MODE',
        )
        ?.trim()
        .toUpperCase();

    if (configured) {
      return configured;
    }

    return this.configService.get(
      'NODE_ENV',
    ) === 'production'
      ? 'KAVENEGAR'
      : 'CONSOLE';
  }

  private maskMobile(mobile: string): string {
    if (mobile.length < 7) {
      return '***';
    }

    return `${mobile.slice(0, 4)}***${mobile.slice(-4)}`;
  }
}
