import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Resolve PostgreSQL connection URL from standard and Vercel marketplace environment variables
function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.STORAGE_URL,
    process.env.STORAGE_PRISMA_URL,
    process.env.STORAGE_DATABASE_URL,
    process.env.STORAGE_POSTGRES_URL,
    process.env.STORAGE_URL_NON_POOLING,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ];

  for (const url of candidates) {
    if (url && (url.startsWith('postgresql://') || url.startsWith('postgres://') || url.startsWith('prisma://'))) {
      return url;
    }
  }

  return process.env.DATABASE_URL || process.env.STORAGE_URL;
}

const activeDbUrl = resolveDatabaseUrl();
if (activeDbUrl && !process.env.DATABASE_URL?.startsWith('postgresql://') && !process.env.DATABASE_URL?.startsWith('postgres://')) {
  process.env.DATABASE_URL = activeDbUrl;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: activeDbUrl
      ? {
          db: {
            url: activeDbUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
