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

const ZARINPAL_REQUEST_URL = 'https://payment.zarinpal.com/pg/v4/payment/request.json';

const ZARINPAL_VERIFY_URL = 'https://payment.zarinpal.com/pg/v4/payment/verify.json';

const ZARINPAL_START_PAY_URL = 'https://payment.zarinpal.com/pg/StartPay';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class ZarinpalPaymentProvider implements PaymentProvider {
  readonly code = 'ZARINPAL' as const;

  constructor(private readonly configService: ConfigService) {}

  ensureReady() {
    this.getMerchantId();
  }

  async initiatePayment(input: PaymentInitiationInput): Promise<PaymentInitiationResult> {
    const merchantId = this.getMerchantId();

    const payload = await this.postToZarinpal(ZARINPAL_REQUEST_URL, {
      merchant_id: merchantId,
      currency: 'IRT',
      amount: input.amountToman,
      callback_url: input.callbackUrl,
      description: `پرداخت سفارش شماره ${input.orderNumber}`,
      metadata: {
        order_id: String(input.orderNumber),
        auto_verify: false,
      },
    });

    const data = this.getResponseData(payload);

    const code = this.readNumber(data.code);
    const authority = this.readString(data.authority);
    const message = this.readString(data.message) ?? 'پاسخ نامعتبر از زرین‌پال دریافت شد';

    if (code !== 100 || !authority) {
      throw new BadGatewayException({
        code: 'ZARINPAL_REQUEST_FAILED',
        message,
      });
    }

    const feeType = this.readString(data.fee_type);
    const fee = this.readNumber(data.fee);

    const responseMetadata: Prisma.InputJsonObject = {
      code,
      message,
      authority,

      ...(feeType
        ? {
            feeType,
          }
        : {}),

      ...(fee !== undefined
        ? {
            fee,
          }
        : {}),
    };

    return {
      providerSessionId: authority,
      redirectUrl: `${ZARINPAL_START_PAY_URL}/${encodeURIComponent(authority)}`,
      requestMetadata: {
        currency: 'IRT',
        amountToman: input.amountToman,
        callbackUrl: input.callbackUrl,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
      },
      responseMetadata,
    };
  }

  parseCallback(query: PaymentCallbackQuery): PaymentCallbackDecision {
    const authority = this.getFirstQueryValue(query, 'Authority')?.trim();

    const status = this.getFirstQueryValue(query, 'Status')?.trim().toUpperCase();

    const callbackMetadata = this.toCallbackMetadata(query);

    if (!authority) {
      return {
        kind: 'invalid',
        code: 'ZARINPAL_CALLBACK_AUTHORITY_MISSING',
        message: 'شناسه Authority در Callback وجود ندارد',
        callbackMetadata,
      };
    }

    if (status === 'OK') {
      return {
        kind: 'approved',
        providerSessionId: authority,
        callbackMetadata,
      };
    }

    if (status === 'NOK') {
      return {
        kind: 'cancelled',
        providerSessionId: authority,
        code: 'ZARINPAL_CALLBACK_CANCELLED',
        message: 'پرداخت توسط کاربر لغو شده یا ناموفق بوده است',
        callbackMetadata,
      };
    }

    return {
      kind: 'invalid',
      providerSessionId: authority,
      code: 'ZARINPAL_CALLBACK_STATUS_INVALID',
      message: 'وضعیت Callback زرین‌پال معتبر نیست',
      callbackMetadata,
    };
  }

  async verifyPayment(input: PaymentVerificationInput): Promise<PaymentVerificationResult> {
    const merchantId = this.getMerchantId();

    const payload = await this.postToZarinpal(ZARINPAL_VERIFY_URL, {
      merchant_id: merchantId,
      amount: input.amountToman,
      authority: input.providerSessionId,
    });

    const data = this.getResponseData(payload);

    const code = this.readNumber(data.code);
    const message = this.readString(data.message) ?? 'پاسخ نامعتبر از زرین‌پال دریافت شد';

    const refId = this.readStringOrNumber(data.ref_id);
    const cardPan = this.readString(data.card_pan);
    const cardHash = this.readString(data.card_hash);
    const feeType = this.readString(data.fee_type);
    const fee = this.readNumber(data.fee);

    const responseMetadata: Prisma.InputJsonObject = {
      code: code ?? -1,
      message,
      authority: input.providerSessionId,
      amountToman: input.amountToman,

      ...(refId
        ? {
            refId,
          }
        : {}),

      ...(cardPan
        ? {
            cardPan,
          }
        : {}),

      ...(cardHash
        ? {
            cardHash,
          }
        : {}),

      ...(feeType
        ? {
            feeType,
          }
        : {}),

      ...(fee !== undefined
        ? {
            fee,
          }
        : {}),
    };

    if (code === 100 || code === 101) {
      return {
        kind: 'verified',
        providerReferenceId: refId,
        cardPan,
        cardHash,
        responseMetadata,
      };
    }

    return {
      kind: 'failed',
      code: `ZARINPAL_VERIFY_${code ?? 'UNKNOWN'}`,
      message,
      responseMetadata,
    };
  }

  private getMerchantId() {
    const merchantId = this.configService.get<string>('ZARINPAL_MERCHANT_ID')?.trim();

    if (!merchantId) {
      throw new ServiceUnavailableException({
        code: 'ZARINPAL_NOT_CONFIGURED',
        message: 'تنظیمات زرین‌پال هنوز تکمیل نشده است',
      });
    }

    return merchantId;
  }

  private async postToZarinpal(url: string, body: Record<string, unknown>): Promise<unknown> {
    const timeoutMs = Number(
      this.configService.get<string>('ZARINPAL_REQUEST_TIMEOUT_MS') ?? '15000',
    );

    const controller = new AbortController();

    const timeoutId = setTimeout(
      () => {
        controller.abort();
      },
      Number.isSafeInteger(timeoutMs) ? timeoutMs : 15000,
    );

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

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new BadGatewayException({
          code: 'ZARINPAL_HTTP_ERROR',
          message: 'ارتباط با سرویس زرین‌پال با خطا مواجه شد',
        });
      }

      return payload;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new ServiceUnavailableException({
        code: 'ZARINPAL_UNREACHABLE',
        message: 'سرویس زرین‌پال در حال حاضر در دسترس نیست',
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getResponseData(payload: unknown): Record<string, unknown> {
    if (!isRecord(payload) || !isRecord(payload.data)) {
      throw new BadGatewayException({
        code: 'ZARINPAL_RESPONSE_INVALID',
        message: 'پاسخ دریافتی از زرین‌پال قابل پردازش نیست',
      });
    }

    return payload.data;
  }

  private getFirstQueryValue(query: PaymentCallbackQuery, key: string) {
    const value = query[key];

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return value[0];
    }

    return undefined;
  }

  private toCallbackMetadata(query: PaymentCallbackQuery): Prisma.InputJsonObject {
    const metadata: Record<string, Prisma.InputJsonValue> = {};

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

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private readStringOrNumber(value: unknown) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return undefined;
  }

  private readNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }
}
