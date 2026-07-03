import { Controller, Get, Logger, Query, Redirect } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PaymentCallbackQuery } from './payment-provider.contract.js';
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
    let outcome: PaymentCallbackOutcome;

    try {
      outcome = await this.paymentCallbackService.handleCallback('ZARINPAL', query);
    } catch (error) {
      this.logger.error(
        'Unexpected Zarinpal callback error',
        error instanceof Error ? error.stack : undefined,
      );

      outcome = {
        state: 'pending',
      };
    }

    return {
      url: this.buildStorefrontRedirectUrl(outcome),
      statusCode: 302,
    };
  }

  private buildStorefrontRedirectUrl(outcome: PaymentCallbackOutcome) {
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
