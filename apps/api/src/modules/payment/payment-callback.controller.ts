import { Controller, Get, Logger, Query, Redirect } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { PaymentCallbackQuery, PaymentProviderCode } from './payment-provider.contract.js';
import { PaymentCallbackService, type PaymentCallbackOutcome } from './payment-callback.service.js';

@Controller({
  path: 'payments/callbacks',
  version: '1',
})
export class PaymentCallbackController {
  private readonly logger = new Logger(PaymentCallbackController.name);

  constructor(
    private readonly paymentCallbackService: PaymentCallbackService,

    private readonly configService: ConfigService,
  ) {}

  @Get('zarinpal')
  @Redirect('/', 302)
  async handleZarinpalCallback(@Query() query: PaymentCallbackQuery) {
    return this.handleProviderCallback('ZARINPAL', query);
  }

  @Get('zibal')
  @Redirect('/', 302)
  async handleZibalCallback(@Query() query: PaymentCallbackQuery) {
    return this.handleProviderCallback('ZIBAL', query);
  }

  private async handleProviderCallback(
    providerCode: PaymentProviderCode,
    query: PaymentCallbackQuery,
  ) {
    let outcome: PaymentCallbackOutcome;

    try {
      outcome = await this.paymentCallbackService.handleCallback(providerCode, query);
    } catch (error) {
      this.logger.error({
        event: 'unexpected_payment_callback_error',
        providerCode,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : String(error),
      });

      outcome = {
        state: 'pending',
      };
    }

    return {
      url: this.buildStorefrontRedirectUrl(outcome),
      statusCode: 302,
    };
  }

  private buildStorefrontRedirectUrl(outcome: PaymentCallbackOutcome): string {
    const storefrontPublicUrl = this.configService.get<string>('STOREFRONT_PUBLIC_URL')?.trim();

    if (!storefrontPublicUrl) {
      throw new Error('STOREFRONT_PUBLIC_URL is not configured');
    }

    const url = new URL('/payment/result', storefrontPublicUrl);

    url.searchParams.set('state', outcome.state);

    if (outcome.orderId) {
      url.searchParams.set('orderId', outcome.orderId);
    }

    return url.toString();
  }
}
