import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Prisma } from '../../../generated/prisma/client.js';
import type {
  PaymentCallbackDecision,
  PaymentCallbackQuery,
  PaymentInitiationInput,
  PaymentInitiationResult,
  PaymentProvider,
  PaymentVerificationInput,
  PaymentVerificationResult,
} from '../payment-provider.contract.js';

const ZIBAL_REQUEST_URL = 'https://gateway.zibal.ir/v1/request';

const ZIBAL_VERIFY_URL = 'https://gateway.zibal.ir/v1/verify';

const ZIBAL_START_PAY_URL = 'https://gateway.zibal.ir/start';

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class ZibalPaymentProvider implements PaymentProvider {
  readonly code = 'ZIBAL' as const;

  constructor(private readonly configService: ConfigService) {}

  ensureReady(): void {
    this.getMerchant();
  }

  async initiatePayment(input: PaymentInitiationInput): Promise<PaymentInitiationResult> {
    const merchant = this.getMerchant();
    const amountRial = this.convertTomanToRial(input.amountToman);

    const requestBody = {
      merchant,
      amount: amountRial,
      callbackUrl: input.callbackUrl,
      description: `پرداخت سفارش شماره ${input.orderNumber}`,
      orderId: String(input.orderNumber),
    };

    const payload = await this.postToZibal(ZIBAL_REQUEST_URL, requestBody);

    const result = this.readNumber(payload.result);

    const trackId = this.readStringOrNumber(payload.trackId);

    const message = this.readString(payload.message) ?? 'پاسخ نامعتبر از زیبال دریافت شد';

    if (result !== 100 || !trackId) {
      throw new BadGatewayException({
        code: `ZIBAL_REQUEST_${result ?? 'UNKNOWN'}`,
        message,
      });
    }

    const responseMetadata: Prisma.InputJsonObject = {
      result,
      message,
      trackId,
    };

    return {
      providerSessionId: trackId,

      redirectUrl: `${ZIBAL_START_PAY_URL}/` + encodeURIComponent(trackId),

      requestMetadata: {
        amountToman: input.amountToman,
        amountRial,
        callbackUrl: input.callbackUrl,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
      },

      responseMetadata,
    };
  }

  parseCallback(query: PaymentCallbackQuery): PaymentCallbackDecision {
    const trackId = this.getFirstQueryValue(query, 'trackId')?.trim();

    const success = this.getFirstQueryValue(query, 'success')?.trim();

    const callbackMetadata = this.toCallbackMetadata(query);

    if (!trackId) {
      return {
        kind: 'invalid',
        code: 'ZIBAL_CALLBACK_TRACK_ID_MISSING',
        message: 'شناسه trackId در Callback زیبال وجود ندارد',
        callbackMetadata,
      };
    }

    if (success === '1') {
      return {
        kind: 'approved',
        providerSessionId: trackId,
        callbackMetadata,
      };
    }

    if (success === '0') {
      return {
        kind: 'cancelled',
        providerSessionId: trackId,
        code: 'ZIBAL_CALLBACK_CANCELLED',
        message: 'پرداخت توسط کاربر لغو شده یا ناموفق بوده است',
        callbackMetadata,
      };
    }

    return {
      kind: 'invalid',
      providerSessionId: trackId,
      code: 'ZIBAL_CALLBACK_SUCCESS_INVALID',
      message: 'وضعیت Callback زیبال معتبر نیست',
      callbackMetadata,
    };
  }

  async verifyPayment(input: PaymentVerificationInput): Promise<PaymentVerificationResult> {
    const merchant = this.getMerchant();

    const trackId = this.parseTrackId(input.providerSessionId);

    const payload = await this.postToZibal(ZIBAL_VERIFY_URL, {
      merchant,
      trackId,
    });

    const result = this.readNumber(payload.result);

    const message = this.readString(payload.message) ?? 'پاسخ نامعتبر از زیبال دریافت شد';

    const refNumber = this.readStringOrNumber(payload.refNumber);

    const cardNumber = this.readString(payload.cardNumber);

    const paidAt = this.readString(payload.paidAt);

    const amountRial = this.readNumber(payload.amount);

    const orderId = this.readStringOrNumber(payload.orderId);

    const status = this.readNumber(payload.status);

    const responseMetadata: Prisma.InputJsonObject = {
      result: result ?? -1,
      message,
      trackId: input.providerSessionId,
      amountToman: input.amountToman,

      ...(amountRial !== undefined ? { amountRial } : {}),

      ...(refNumber ? { refNumber } : {}),

      ...(cardNumber ? { cardNumber } : {}),

      ...(paidAt ? { paidAt } : {}),

      ...(orderId ? { orderId } : {}),

      ...(status !== undefined ? { status } : {}),
    };

    /*
     * 100: پرداخت با موفقیت تأیید شد
     * 201: این تراکنش قبلاً تأیید شده است
     */
    if (result === 100 || result === 201) {
      return {
        kind: 'verified',
        providerReferenceId: refNumber,
        cardPan: cardNumber,
        responseMetadata,
      };
    }

    return {
      kind: 'failed',
      code: `ZIBAL_VERIFY_${result ?? 'UNKNOWN'}`,
      message,
      responseMetadata,
    };
  }

  private getMerchant(): string {
    const merchant = this.configService.get<string>('ZIBAL_MERCHANT')?.trim();

    if (!merchant) {
      throw new ServiceUnavailableException({
        code: 'ZIBAL_NOT_CONFIGURED',
        message: 'تنظیمات درگاه زیبال هنوز تکمیل نشده است',
      });
    }

    return merchant;
  }

  private convertTomanToRial(amountToman: number): number {
    const amountRial = amountToman * 10;

    if (!Number.isSafeInteger(amountRial) || amountRial <= 0) {
      throw new BadGatewayException({
        code: 'ZIBAL_AMOUNT_INVALID',
        message: 'مبلغ پرداخت برای ارسال به زیبال معتبر نیست',
      });
    }

    return amountRial;
  }

  private parseTrackId(value: string): number {
    const trackId = Number(value);

    if (!Number.isSafeInteger(trackId) || trackId <= 0) {
      throw new BadGatewayException({
        code: 'ZIBAL_TRACK_ID_INVALID',
        message: 'شناسه تراکنش زیبال معتبر نیست',
      });
    }

    return trackId;
  }

  private async postToZibal(
    url: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const configuredTimeout = Number(
      this.configService.get<string>('ZIBAL_REQUEST_TIMEOUT_MS') ?? DEFAULT_REQUEST_TIMEOUT_MS,
    );

    const timeoutMs =
      Number.isSafeInteger(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : DEFAULT_REQUEST_TIMEOUT_MS;

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',

        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },

        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new BadGatewayException({
          code: 'ZIBAL_HTTP_ERROR',
          message: 'ارتباط با سرویس زیبال با خطا مواجه شد',
        });
      }

      if (!isRecord(payload)) {
        throw new BadGatewayException({
          code: 'ZIBAL_RESPONSE_INVALID',
          message: 'پاسخ دریافتی از زیبال قابل پردازش نیست',
        });
      }

      return payload;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new ServiceUnavailableException({
        code: 'ZIBAL_UNREACHABLE',
        message: 'سرویس زیبال در حال حاضر در دسترس نیست',
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getFirstQueryValue(query: PaymentCallbackQuery, key: string): string | undefined {
    const value = query[key];

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.find((item): item is string => typeof item === 'string');
    }

    return undefined;
  }

  private toCallbackMetadata(query: PaymentCallbackQuery): Prisma.InputJsonObject {
    const metadata: Record<string, string | string[]> = {};

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string') {
        metadata[key] = value;
        continue;
      }

      if (Array.isArray(value)) {
        metadata[key] = value.filter((item): item is string => typeof item === 'string');
      }
    }

    return metadata;
  }

  private readString(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    return undefined;
  }

  private readStringOrNumber(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return undefined;
  }

  private readNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsedValue = Number(value);

      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }

    return undefined;
  }
}
