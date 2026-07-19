import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import type { PaymentProvider, PaymentProviderCode } from '../payment-provider.contract.js';
import { ZarinpalPaymentProvider } from './zarinpal-payment.provider.js';
import { ZibalPaymentProvider } from './zibal-payment.provider.js';

@Injectable()
export class PaymentProviderRegistry {
  private readonly providers: Map<PaymentProviderCode, PaymentProvider>;

  constructor(
    zarinpalPaymentProvider: ZarinpalPaymentProvider,
    zibalPaymentProvider: ZibalPaymentProvider,
  ) {
    this.providers = new Map<PaymentProviderCode, PaymentProvider>([
      [zarinpalPaymentProvider.code, zarinpalPaymentProvider],
      [zibalPaymentProvider.code, zibalPaymentProvider],
    ]);
  }

  get(providerCode: PaymentProviderCode): PaymentProvider {
    const provider = this.providers.get(providerCode);

    if (!provider) {
      throw new ServiceUnavailableException({
        code: 'PAYMENT_PROVIDER_UNAVAILABLE',
        message: 'درگاه پرداخت انتخاب‌شده در دسترس نیست',
      });
    }

    return provider;
  }
}
