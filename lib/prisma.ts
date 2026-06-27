import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Cache the Prisma client on globalThis in ALL environments (dev + production).
// In serverless (AWS Lambda), globalThis persists across warm invocations within
// the same container. Without this, every warm request creates a new PrismaClient
// and opens a fresh connection pool to Supabase — adding 2–5s of latency.
export const prisma = globalForPrisma.prisma || new PrismaClient();

globalForPrisma.prisma = prisma;
