import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  await prisma.$connect();
  const count = await prisma.product.count();
  console.log('✅ DB OK — product count:', count);
  await prisma.$disconnect();
} catch (e) {
  console.error('❌ DB FAIL:', e.message);
  process.exit(1);
}
