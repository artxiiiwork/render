// "Переходник" к базе данных.
// Здесь создаётся один общий PrismaClient на всё приложение,
// чтобы при разработке не плодились лишние подключения к базе.
import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Бесплатная база Neon «засыпает» при простое и на первый запрос может ответить
// ошибкой P1001 («не достучаться до сервера»), пока просыпается (1–3 сек).
// Чтобы это не превращалось в ошибку у пользователя — пара тихих повторов.
function withRetry(client: PrismaClient) {
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        let lastError: unknown;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            return await query(args);
          } catch (e) {
            const code =
              e instanceof Prisma.PrismaClientInitializationError
                ? e.errorCode
                : (e as { code?: string })?.code;
            // Повторяем только «база недоступна / просыпается».
            if (code !== "P1001") throw e;
            lastError = e;
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          }
        }
        throw lastError;
      },
    },
  });
}

const base = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = base;
}

export const prisma = withRetry(base) as unknown as PrismaClient;
