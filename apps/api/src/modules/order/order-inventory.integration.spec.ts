import { jest } from '@jest/globals';
import { PrismaPg } from '@prisma/adapter-pg';

import { Prisma, PrismaClient, ProductStatus, StockStatus } from '../../generated/prisma/client.js';

import { reserveOrderInventory } from './order-inventory.utils.js';

jest.setTimeout(30_000);

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase('order inventory concurrency integration', () => {
  let prisma: PrismaClient;
  let productId: string | null = null;
  let brandId: string | null = null;
  let categoryId: string | null = null;

  beforeAll(async () => {
    const adapter = new PrismaPg({
      connectionString: testDatabaseUrl!,
    });

    prisma = new PrismaClient({
      adapter,
    });

    await prisma.$connect();
  });

  afterEach(async () => {
    if (productId) {
      await prisma.product.deleteMany({
        where: {
          id: productId,
        },
      });
    }

    if (categoryId) {
      await prisma.category.deleteMany({
        where: {
          id: categoryId,
        },
      });
    }

    if (brandId) {
      await prisma.brand.deleteMany({
        where: {
          id: brandId,
        },
      });
    }

    productId = null;
    categoryId = null;
    brandId = null;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('allows only one of two simultaneous reservations for the final unit', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const brand = await prisma.brand.create({
      data: {
        name: `Inventory Test Brand ${suffix}`,
        slug: `inventory-test-brand-${suffix}`,
      },
    });

    brandId = brand.id;

    const category = await prisma.category.create({
      data: {
        name: `Inventory Test Category ${suffix}`,
        slug: `inventory-test-category-${suffix}`,
      },
    });

    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        sku: `INVENTORY-${suffix}`,
        slug: `inventory-product-${suffix}`,
        name: 'محصول تست هم‌زمانی موجودی',
        brandId: brand.id,
        categoryId: category.id,
        status: ProductStatus.ACTIVE,
        isPublished: true,
        stockStatus: StockStatus.IN_STOCK,
        stockQuantity: 1,
        lowStockThreshold: 1,
        priceToman: 100_000,
      },
    });

    productId = product.id;

    const reserveFinalUnit = () =>
      prisma.$transaction(
        (transaction) =>
          reserveOrderInventory(transaction, [
            {
              productId: product.id,
              productName: product.name,
              quantity: 1,
            },
          ]),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

    const results = await Promise.allSettled([reserveFinalUnit(), reserveFinalUnit()]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);

    const finalProduct = await prisma.product.findUniqueOrThrow({
      where: {
        id: product.id,
      },
      select: {
        stockQuantity: true,
        stockStatus: true,
      },
    });

    expect(finalProduct.stockQuantity).toBe(0);
    expect(finalProduct.stockStatus).toBe(StockStatus.OUT_OF_STOCK);
  });
});
