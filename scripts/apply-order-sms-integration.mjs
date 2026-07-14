import {
  readFile,
  writeFile,
} from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();

async function read(relativePath) {
  return readFile(
    resolve(root, relativePath),
    'utf8',
  );
}

async function write(relativePath, value) {
  await writeFile(
    resolve(root, relativePath),
    value,
    'utf8',
  );
  console.log(`Patched ${relativePath}`);
}

function insertOnce(
  source,
  marker,
  insertion,
  description,
) {
  if (source.includes(insertion.trim())) {
    return source;
  }

  const index = source.indexOf(marker);

  if (index < 0) {
    throw new Error(
      `Could not find ${description}`,
    );
  }

  return (
    source.slice(0, index) +
    insertion +
    source.slice(index)
  );
}

function replaceOnce(
  source,
  search,
  replacement,
  description,
) {
  if (source.includes(replacement.trim())) {
    return source;
  }

  const index = source.indexOf(search);

  if (index < 0) {
    throw new Error(
      `Could not find ${description}`,
    );
  }

  return source.replace(search, replacement);
}

async function patchSchema() {
  const path = 'prisma/schema.prisma';
  let source = await read(path);

  if (!source.includes('enum OrderSmsType')) {
    source = insertOnce(
      source,
      'enum BlogPostStatus',
      `enum OrderSmsType {
  CUSTOMER_PAYMENT_REMINDER
  CUSTOMER_PAYMENT_SUCCESS
  CUSTOMER_ORDER_SHIPPED
  ADMIN_NEW_PAID_ORDER
}

enum SmsOutboxStatus {
  PENDING
  PROCESSING
  SENT
  FAILED
  CANCELLED
}

`,
      'BlogPostStatus enum',
    );
  }

  if (!source.includes('smsOutbox OrderSmsOutbox[]')) {
    source = replaceOnce(
      source,
      '  paymentAttempts PaymentAttempt[]',
      `  paymentAttempts PaymentAttempt[]
  smsOutbox       OrderSmsOutbox[]`,
      'Order.paymentAttempts relation',
    );
  }

  if (!source.includes('model OrderSmsOutbox')) {
    source = insertOnce(
      source,
      'model BlogCategory',
      `model OrderSmsOutbox {
  id               String          @id @default(uuid())
  orderId          String
  order            Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  type             OrderSmsType
  recipient        String
  status           SmsOutboxStatus @default(PENDING)
  dueAt            DateTime
  attempts         Int             @default(0)
  lockedAt         DateTime?
  provider         String          @default("KAVENEGAR")
  providerMessageId String?
  lastError        String?
  sentAt           DateTime?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  @@unique([orderId, type, recipient])
  @@index([status, dueAt])
  @@index([orderId, createdAt])
}

`,
      'BlogCategory model',
    );
  }

  await write(path, source);
}

async function patchAppModule() {
  const path = 'apps/api/src/app.module.ts';
  let source = await read(path);

  if (
    !source.includes(
      "from './modules/order-sms/order-sms.module.js'",
    )
  ) {
    source = insertOnce(
      source,
      "import { OrderModule }",
      `import { OrderSmsModule } from './modules/order-sms/order-sms.module.js';
`,
      'OrderModule import',
    );
  }

  if (
    !/\bOrderSmsModule,\s*\n/.test(source)
  ) {
    source = replaceOnce(
      source,
      '    OrderModule,',
      `    OrderSmsModule,
    OrderModule,`,
      'OrderModule in imports',
    );
  }

  await write(path, source);
}

function addConstructorDependency(
  source,
  className,
  declaration,
) {
  if (source.includes(declaration.trim())) {
    return source;
  }

  const classIndex = source.indexOf(
    `export class ${className}`,
  );

  if (classIndex < 0) {
    throw new Error(
      `Could not find class ${className}`,
    );
  }

  const constructorIndex = source.indexOf(
    'constructor(',
    classIndex,
  );

  if (constructorIndex < 0) {
    throw new Error(
      `Could not find constructor of ${className}`,
    );
  }

  const closingIndex = source.indexOf(
    ') {}',
    constructorIndex,
  );

  if (closingIndex >= 0) {
    return (
      source.slice(0, closingIndex) +
      declaration +
      source.slice(closingIndex)
    );
  }

  const bodyIndex = source.indexOf(
    ') {',
    constructorIndex,
  );

  if (bodyIndex < 0) {
    throw new Error(
      `Could not find constructor closing of ${className}`,
    );
  }

  return (
    source.slice(0, bodyIndex) +
    declaration +
    source.slice(bodyIndex)
  );
}

async function patchOrderService() {
  const path =
    'apps/api/src/modules/order/order.service.ts';
  let source = await read(path);

  if (
    !source.includes(
      "from '../order-sms/order-sms-outbox.service.js'",
    )
  ) {
    source = insertOnce(
      source,
      "import type { CreateOrderFromCartDto }",
      `import { OrderSmsOutboxService } from '../order-sms/order-sms-outbox.service.js';
`,
      'CreateOrderFromCartDto import',
    );
  }

  source = addConstructorDependency(
    source,
    'OrderService',
    `
    private readonly orderSmsOutbox: OrderSmsOutboxService,`,
  );

  if (
    !source.includes(
      'this.orderSmsOutbox.enqueuePaymentReminder',
    )
  ) {
    source = insertOnce(
      source,
      '    await transaction.cart.update({',
      `    await this.orderSmsOutbox.enqueuePaymentReminder(
      transaction,
      {
        orderId: order.id,
        recipient: address.recipientMobile,
        createdAt: now,
      },
    );

`,
      'cart update after order creation',
    );
  }

  await write(path, source);
}

async function patchPaymentCallback() {
  const path =
    'apps/api/src/modules/payment/payment-callback.service.ts';
  let source = await read(path);

  if (
    !source.includes(
      "from '../order-sms/order-sms-outbox.service.js'",
    )
  ) {
    source = insertOnce(
      source,
      "import { PrismaService }",
      `import { OrderSmsOutboxService } from '../order-sms/order-sms-outbox.service.js';
`,
      'PrismaService import',
    );
  }

  source = addConstructorDependency(
    source,
    'PaymentCallbackService',
    `
    private readonly orderSmsOutbox: OrderSmsOutboxService,`,
  );

  if (
    !source.includes(
      'this.orderSmsOutbox.enqueuePaymentSucceeded',
    )
  ) {
    const marker =
      `      if (orderResult.count !== 1) {
        throw new ConflictException({`;

    const markerIndex =
      source.indexOf(marker);

    if (markerIndex < 0) {
      throw new Error(
        'Could not find verified order result check',
      );
    }

    const returnIndex = source.indexOf(
      '      return true;',
      markerIndex,
    );

    if (returnIndex < 0) {
      throw new Error(
        'Could not find markAttemptVerified return',
      );
    }

    source =
      source.slice(0, returnIndex) +
      `      await this.orderSmsOutbox.enqueuePaymentSucceeded(
        transaction,
        attempt.orderId,
      );

` +
      source.slice(returnIndex);
  }

  await write(path, source);
}

async function patchAdminOrder() {
  const path =
    'apps/api/src/modules/admin-order/admin-order.service.ts';
  let source = await read(path);

  if (
    !source.includes(
      "from '../order-sms/order-sms-outbox.service.js'",
    )
  ) {
    source = insertOnce(
      source,
      "import { PrismaService }",
      `import { OrderSmsOutboxService } from '../order-sms/order-sms-outbox.service.js';
`,
      'PrismaService import',
    );
  }

  if (
    source.includes(
      'constructor(private readonly prisma: PrismaService) {}',
    )
  ) {
    source = source.replace(
      'constructor(private readonly prisma: PrismaService) {}',
      `constructor(
    private readonly prisma: PrismaService,
    private readonly orderSmsOutbox: OrderSmsOutboxService,
  ) {}`,
    );
  } else {
    source = addConstructorDependency(
      source,
      'AdminOrderService',
      `
    private readonly orderSmsOutbox: OrderSmsOutboxService,`,
    );
  }

  if (
    !source.includes(
      'this.orderSmsOutbox.enqueueOrderShipped',
    )
  ) {
    const methodStart = source.indexOf(
      '  async markShipped(',
    );
    const methodEnd = source.indexOf(
      '  async markDelivered(',
      methodStart,
    );

    if (
      methodStart < 0 ||
      methodEnd < 0
    ) {
      throw new Error(
        'Could not locate markShipped method',
      );
    }

    const method = source.slice(
      methodStart,
      methodEnd,
    );

    const auditMarker =
      "event: 'admin_order_shipment_registered'";

    const auditIndex =
      method.indexOf(auditMarker);

    if (auditIndex < 0) {
      throw new Error(
        'Could not find shipment audit event',
      );
    }

    const transactionClose =
      method.lastIndexOf('    });');

    if (transactionClose < auditIndex) {
      throw new Error(
        'Could not find shipment transaction closing',
      );
    }

    const insertionPoint =
      methodStart + transactionClose;

    source =
      source.slice(0, insertionPoint) +
      `    await this.orderSmsOutbox.enqueueOrderShipped(
      transaction,
      orderId,
    );
` +
      source.slice(insertionPoint);
  }

  await write(path, source);
}

async function patchEnvExample() {
  const path = 'apps/api/.env.example';
  let source = await read(path);

  if (
    source.includes(
      'ORDER_SMS_DELIVERY_MODE=',
    )
  ) {
    return;
  }

  source += `

# Transactional order SMS
ORDER_SMS_WORKER_ENABLED=true
ORDER_SMS_DELIVERY_MODE=CONSOLE
ORDER_SMS_ADMIN_MOBILES=
ORDER_SMS_REMINDER_DELAY_MINUTES=7
ORDER_SMS_SWEEP_INTERVAL_MS=30000
ORDER_SMS_SWEEP_BATCH_SIZE=50
ORDER_SMS_LOCK_TIMEOUT_MS=120000
ORDER_SMS_MAX_ATTEMPTS=5

KAVENEGAR_ORDER_PAYMENT_REMINDER_TEMPLATE=partsanj-order-reminder
KAVENEGAR_ORDER_PAYMENT_SUCCESS_TEMPLATE=partsanj-order-paid
KAVENEGAR_ORDER_SHIPPED_TEMPLATE=partsanj-order-shipped
KAVENEGAR_ADMIN_NEW_PAID_ORDER_TEMPLATE=partsanj-admin-new-paid-order
`;

  await write(path, source);
}

await patchSchema();
await patchAppModule();
await patchOrderService();
await patchPaymentCallback();
await patchAdminOrder();
await patchEnvExample();

console.log(
  'Order SMS integration patches were applied.',
);
