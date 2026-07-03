import type { Prisma } from '../../generated/prisma/client.js';

export type PaymentProviderCode = 'ZARINPAL';

export type PaymentCallbackQuery = Record<string, string | string[] | undefined>;

export type PaymentInitiationInput = {
  paymentAttemptId: string;
  orderId: string;
  orderNumber: number;
  amountToman: number;
  callbackUrl: string;
};

export type PaymentInitiationResult = {
  providerSessionId: string;
  redirectUrl: string;

  requestMetadata?: Prisma.InputJsonObject;
  responseMetadata?: Prisma.InputJsonObject;
};

export type PaymentCallbackDecision =
  | {
      kind: 'approved';
      providerSessionId: string;
      callbackMetadata: Prisma.InputJsonObject;
    }
  | {
      kind: 'cancelled';
      providerSessionId: string;
      code: string;
      message: string;
      callbackMetadata: Prisma.InputJsonObject;
    }
  | {
      kind: 'invalid';
      providerSessionId?: string;
      code: string;
      message: string;
      callbackMetadata: Prisma.InputJsonObject;
    };

export type PaymentVerificationInput = {
  paymentAttemptId: string;
  orderId: string;
  orderNumber: number;
  amountToman: number;
  providerSessionId: string;
};

export type PaymentVerificationResult =
  | {
      kind: 'verified';
      providerReferenceId?: string;
      cardPan?: string;
      cardHash?: string;
      responseMetadata: Prisma.InputJsonObject;
    }
  | {
      kind: 'failed';
      code: string;
      message: string;
      responseMetadata: Prisma.InputJsonObject;
    };

export interface PaymentProvider {
  readonly code: PaymentProviderCode;

  ensureReady(): void;

  initiatePayment(input: PaymentInitiationInput): Promise<PaymentInitiationResult>;

  parseCallback(query: PaymentCallbackQuery): PaymentCallbackDecision;

  verifyPayment(input: PaymentVerificationInput): Promise<PaymentVerificationResult>;
}
