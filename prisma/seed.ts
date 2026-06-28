import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import {
  PrismaClient,
  ProductCodeType,
  ProductStatus,
  StockStatus,
} from '../apps/api/src/generated/prisma/client.js';

config({
  path: 'apps/api/.env',
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing');
}

if (process.env.NODE_ENV !== 'development') {
  throw new Error('Development seed can only run when NODE_ENV=development');
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('Starting PartSanj development seed...');

  const electricalParts = await prisma.category.upsert({
    where: {
      slug: 'electrical-parts',
    },
    update: {
      name: 'قطعات برقی خودرو',
      isActive: true,
      sortOrder: 10,
      parentId: null,
    },
    create: {
      name: 'قطعات برقی خودرو',
      slug: 'electrical-parts',
      isActive: true,
      sortOrder: 10,
    },
  });

  const sensors = await prisma.category.upsert({
    where: {
      slug: 'sensors',
    },
    update: {
      name: 'سنسورها',
      isActive: true,
      sortOrder: 20,
      parentId: electricalParts.id,
    },
    create: {
      name: 'سنسورها',
      slug: 'sensors',
      isActive: true,
      sortOrder: 20,
      parentId: electricalParts.id,
    },
  });

  const connectors = await prisma.category.upsert({
    where: {
      slug: 'connectors',
    },
    update: {
      name: 'سوکت و کانکتور',
      isActive: true,
      sortOrder: 30,
      parentId: electricalParts.id,
    },
    create: {
      name: 'سوکت و کانکتور',
      slug: 'connectors',
      isActive: true,
      sortOrder: 30,
      parentId: electricalParts.id,
    },
  });

  const relays = await prisma.category.upsert({
    where: {
      slug: 'relays',
    },
    update: {
      name: 'رله و فیوز',
      isActive: true,
      sortOrder: 40,
      parentId: electricalParts.id,
    },
    create: {
      name: 'رله و فیوز',
      slug: 'relays',
      isActive: true,
      sortOrder: 40,
      parentId: electricalParts.id,
    },
  });

  const demoParts = await prisma.brand.upsert({
    where: {
      slug: 'demo-parts',
    },
    update: {
      name: 'Demo Parts',
      isActive: true,
    },
    create: {
      name: 'Demo Parts',
      slug: 'demo-parts',
      isActive: true,
    },
  });

  const testElectro = await prisma.brand.upsert({
    where: {
      slug: 'test-electro',
    },
    update: {
      name: 'Test Electro',
      isActive: true,
    },
    create: {
      name: 'Test Electro',
      slug: 'test-electro',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: {
      sku: 'DEMO-O2-001',
    },
    update: {
      slug: 'demo-oxygen-sensor',
      name: 'سنسور اکسیژن نمونه توسعه',
      shortDescription: 'داده آزمایشی برای تست کاتالوگ PartSanj',
      description:
        'این محصول فقط برای محیط توسعه ایجاد شده است و نباید در سایت واقعی یا Feed ترب فعال شود',
      specifications: {
        environment: 'development',
        connectorPins: 4,
        testCode: 'DEMO-O2-001',
      },
      priceToman: 1250000,
      stockStatus: StockStatus.IN_STOCK,
      status: ProductStatus.ACTIVE,
      isPublished: true,
      isTorobEnabled: false,
      brandId: demoParts.id,
      categoryId: sensors.id,
      codes: {
        deleteMany: {},
        create: [
          {
            type: ProductCodeType.TECHNICAL,
            value: 'DEMO-O2-001',
          },
          {
            type: ProductCodeType.OEM,
            value: 'PSJ-DEMO-1001',
          },
          {
            type: ProductCodeType.SUPPLIER,
            value: 'SUP-DEMO-001',
          },
        ],
      },
      images: {
        deleteMany: {},
        create: [
          {
            url: 'https://placehold.co/1200x1200/png?text=Demo+O2+Sensor',
            alt: 'سنسور اکسیژن نمونه توسعه',
            sortOrder: 0,
          },
        ],
      },
    },
    create: {
      sku: 'DEMO-O2-001',
      slug: 'demo-oxygen-sensor',
      name: 'سنسور اکسیژن نمونه توسعه',
      shortDescription: 'داده آزمایشی برای تست کاتالوگ PartSanj',
      description:
        'این محصول فقط برای محیط توسعه ایجاد شده است و نباید در سایت واقعی یا Feed ترب فعال شود',
      specifications: {
        environment: 'development',
        connectorPins: 4,
        testCode: 'DEMO-O2-001',
      },
      priceToman: 1250000,
      stockStatus: StockStatus.IN_STOCK,
      status: ProductStatus.ACTIVE,
      isPublished: true,
      isTorobEnabled: false,
      brandId: demoParts.id,
      categoryId: sensors.id,
      codes: {
        create: [
          {
            type: ProductCodeType.TECHNICAL,
            value: 'DEMO-O2-001',
          },
          {
            type: ProductCodeType.OEM,
            value: 'PSJ-DEMO-1001',
          },
          {
            type: ProductCodeType.SUPPLIER,
            value: 'SUP-DEMO-001',
          },
        ],
      },
      images: {
        create: [
          {
            url: 'https://placehold.co/1200x1200/png?text=Demo+O2+Sensor',
            alt: 'سنسور اکسیژن نمونه توسعه',
            sortOrder: 0,
          },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: {
      sku: 'DEMO-CON-002',
    },
    update: {
      slug: 'demo-injector-connector',
      name: 'سوکت انژکتور نمونه توسعه',
      shortDescription: 'داده آزمایشی برای تست فیلتر و جست‌وجوی کاتالوگ',
      description:
        'این محصول صرفاً برای تست محیط توسعه پارت‌سنج ایجاد شده و قطعه واقعی قابل فروش نیست',
      specifications: {
        environment: 'development',
        connectorPins: 2,
        testCode: 'DEMO-CON-002',
      },
      priceToman: 450000,
      stockStatus: StockStatus.CHECK_AVAILABILITY,
      status: ProductStatus.ACTIVE,
      isPublished: true,
      isTorobEnabled: false,
      brandId: testElectro.id,
      categoryId: connectors.id,
      codes: {
        deleteMany: {},
        create: [
          {
            type: ProductCodeType.TECHNICAL,
            value: 'DEMO-CON-002',
          },
          {
            type: ProductCodeType.OEM,
            value: 'PSJ-DEMO-2002',
          },
        ],
      },
      images: {
        deleteMany: {},
        create: [
          {
            url: 'https://placehold.co/1200x1200/png?text=Demo+Injector+Connector',
            alt: 'سوکت انژکتور نمونه توسعه',
            sortOrder: 0,
          },
        ],
      },
    },
    create: {
      sku: 'DEMO-CON-002',
      slug: 'demo-injector-connector',
      name: 'سوکت انژکتور نمونه توسعه',
      shortDescription: 'داده آزمایشی برای تست فیلتر و جست‌وجوی کاتالوگ',
      description:
        'این محصول صرفاً برای تست محیط توسعه پارت‌سنج ایجاد شده و قطعه واقعی قابل فروش نیست',
      specifications: {
        environment: 'development',
        connectorPins: 2,
        testCode: 'DEMO-CON-002',
      },
      priceToman: 450000,
      stockStatus: StockStatus.CHECK_AVAILABILITY,
      status: ProductStatus.ACTIVE,
      isPublished: true,
      isTorobEnabled: false,
      brandId: testElectro.id,
      categoryId: connectors.id,
      codes: {
        create: [
          {
            type: ProductCodeType.TECHNICAL,
            value: 'DEMO-CON-002',
          },
          {
            type: ProductCodeType.OEM,
            value: 'PSJ-DEMO-2002',
          },
        ],
      },
      images: {
        create: [
          {
            url: 'https://placehold.co/1200x1200/png?text=Demo+Injector+Connector',
            alt: 'سوکت انژکتور نمونه توسعه',
            sortOrder: 0,
          },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: {
      sku: 'DEMO-RLY-003',
    },
    update: {
      slug: 'demo-automotive-relay',
      name: 'رله خودرو نمونه توسعه',
      shortDescription: 'محصول آزمایشی برای تست وضعیت ناموجود',
      description: 'این داده برای بررسی فیلتر وضعیت موجودی در API کاتالوگ استفاده می‌شود',
      specifications: {
        environment: 'development',
        testCode: 'DEMO-RLY-003',
      },
      priceToman: 780000,
      stockStatus: StockStatus.OUT_OF_STOCK,
      status: ProductStatus.ACTIVE,
      isPublished: true,
      isTorobEnabled: false,
      brandId: demoParts.id,
      categoryId: relays.id,
      codes: {
        deleteMany: {},
        create: [
          {
            type: ProductCodeType.TECHNICAL,
            value: 'DEMO-RLY-003',
          },
          {
            type: ProductCodeType.SUPPLIER,
            value: 'SUP-DEMO-003',
          },
        ],
      },
      images: {
        deleteMany: {},
        create: [
          {
            url: 'https://placehold.co/1200x1200/png?text=Demo+Relay',
            alt: 'رله خودرو نمونه توسعه',
            sortOrder: 0,
          },
        ],
      },
    },
    create: {
      sku: 'DEMO-RLY-003',
      slug: 'demo-automotive-relay',
      name: 'رله خودرو نمونه توسعه',
      shortDescription: 'محصول آزمایشی برای تست وضعیت ناموجود',
      description: 'این داده برای بررسی فیلتر وضعیت موجودی در API کاتالوگ استفاده می‌شود',
      specifications: {
        environment: 'development',
        testCode: 'DEMO-RLY-003',
      },
      priceToman: 780000,
      stockStatus: StockStatus.OUT_OF_STOCK,
      status: ProductStatus.ACTIVE,
      isPublished: true,
      isTorobEnabled: false,
      brandId: demoParts.id,
      categoryId: relays.id,
      codes: {
        create: [
          {
            type: ProductCodeType.TECHNICAL,
            value: 'DEMO-RLY-003',
          },
          {
            type: ProductCodeType.SUPPLIER,
            value: 'SUP-DEMO-003',
          },
        ],
      },
      images: {
        create: [
          {
            url: 'https://placehold.co/1200x1200/png?text=Demo+Relay',
            alt: 'رله خودرو نمونه توسعه',
            sortOrder: 0,
          },
        ],
      },
    },
  });

  console.log('PartSanj development seed completed successfully');
}

main()
  .catch((error: unknown) => {
    console.error('PartSanj development seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
