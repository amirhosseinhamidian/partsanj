import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { PrismaClient, UserRole } from '../apps/api/src/generated/prisma/client.js';

config({
  path: 'apps/api/.env',
});

function normalizeIranianMobile(value: string): string {
  let mobile = value
    .trim()
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s()-]/g, '');

  if (mobile.startsWith('+98')) {
    mobile = `0${mobile.slice(3)}`;
  } else if (mobile.startsWith('0098')) {
    mobile = `0${mobile.slice(4)}`;
  } else if (mobile.startsWith('98')) {
    mobile = `0${mobile.slice(2)}`;
  } else if (mobile.startsWith('9') && mobile.length === 10) {
    mobile = `0${mobile}`;
  }

  return mobile;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('This script is restricted to the development environment');
  }

  const rawMobile = process.argv.slice(2).find((argument) => argument !== '--');

  if (!rawMobile) {
    throw new Error('Usage: pnpm dev:promote-admin -- 09121234567');
  }

  const mobile = normalizeIranianMobile(rawMobile);

  if (!/^09\d{9}$/.test(mobile)) {
    throw new Error('Provide a valid Iranian mobile number');
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrl,
    }),
  });

  try {
    const user = await prisma.user.findUnique({
      where: {
        mobile,
      },
    });

    if (!user) {
      throw new Error(`No user exists for ${mobile}. Complete OTP login first.`);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        role: UserRole.ADMIN,
      },
      select: {
        id: true,
        mobile: true,
        role: true,
        isActive: true,
      },
    });

    console.log('User promoted to ADMIN:');
    console.log(updatedUser);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
