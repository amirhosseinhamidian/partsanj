import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  createErrorDetails,
  createLogContext,
  maskMobile,
} from '../../common/logging/logging.utils.js';

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

@Injectable()
export class KavenegarService {
  private readonly logger = new Logger(KavenegarService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationCode(
    mobile: string,
    code: string,
  ): Promise<{ providerMessageId?: string }> {
    const deliveryMode = (
      this.configService.get<string>('OTP_DELIVERY_MODE', 'KAVENEGAR') ?? 'KAVENEGAR'
    ).toUpperCase();

    if (deliveryMode === 'CONSOLE') {
      const nodeEnv = this.configService.get<string>('NODE_ENV');

      if (nodeEnv !== 'development') {
        throw new InternalServerErrorException(
          'ارسال کد تأیید از طریق کنسول خارج از محیط توسعه مجاز نیست.',
        );
      }

      this.logger.warn(
        createLogContext('otp_console_delivery_used', {
          provider: 'console',
          mobile: maskMobile(mobile),
          code,
        }),
      );

      return {};
    }

    if (deliveryMode !== 'KAVENEGAR') {
      throw new InternalServerErrorException('روش ارسال کد تأیید پشتیبانی نمی‌شود.');
    }

    const apiKey = this.configService.getOrThrow<string>('KAVENEGAR_API_KEY');

    const template = this.configService.getOrThrow<string>('KAVENEGAR_OTP_TEMPLATE');

    const url = new URL(`https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`);

    url.searchParams.set('receptor', mobile);
    url.searchParams.set('token', code);
    url.searchParams.set('template', template);

    let response: Response;

    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      this.logger.error(
        createLogContext('otp_delivery_request_failed', {
          provider: 'kavenegar',
          mobile: maskMobile(mobile),
          error: createErrorDetails(error),
        }),
      );

      throw new ServiceUnavailableException(
        'ارسال کد تأیید در حال حاضر امکان‌پذیر نیست. لطفاً دوباره تلاش کنید.',
      );
    }

    const payload = (await response.json().catch(() => null)) as KavenegarResponse | null;

    if (!response.ok || payload?.return?.status !== 200) {
      this.logger.error(
        createLogContext('otp_delivery_provider_rejected', {
          provider: 'kavenegar',
          mobile: maskMobile(mobile),
          httpStatus: response.status,
          providerStatus: payload?.return?.status,
          providerMessage: payload?.return?.message,
        }),
      );

      throw new ServiceUnavailableException('Unable to send verification code');
    }

    const entry = Array.isArray(payload.entries) ? payload.entries[0] : payload.entries;
    const providerMessageId = entry?.messageid ? String(entry.messageid) : undefined;

    this.logger.log(
      createLogContext('otp_delivery_succeeded', {
        provider: 'kavenegar',
        mobile: maskMobile(mobile),
        providerMessageId,
      }),
    );

    return {
      providerMessageId,
    };
  }
}
