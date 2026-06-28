import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
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
          'Console OTP delivery is forbidden outside development',
        );
      }

      this.logger.warn(`[Development only] OTP for ${mobile}: ${code}`);

      return {};
    }

    if (deliveryMode !== 'KAVENEGAR') {
      throw new InternalServerErrorException('Unsupported OTP delivery mode');
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
    } catch {
      this.logger.error('Kavenegar request failed');

      throw new ServiceUnavailableException('Unable to send verification code');
    }

    const payload = (await response.json().catch(() => null)) as KavenegarResponse | null;

    if (!response.ok || payload?.return?.status !== 200) {
      this.logger.error(`Kavenegar lookup failed with HTTP ${response.status}`);

      throw new ServiceUnavailableException('Unable to send verification code');
    }

    const entry = Array.isArray(payload.entries) ? payload.entries[0] : payload.entries;

    return {
      providerMessageId: entry?.messageid ? String(entry.messageid) : undefined,
    };
  }
}
