// Настройки "охранника" сайта (Auth.js / NextAuth).
// Вход по email+паролю, а также через соцсети (Яндекс ID, ВКонтакте).

import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Yandex from "next-auth/providers/yandex";
import VK from "next-auth/providers/vk";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Соцпровайдеры включаем только если заданы их ключи в окружении. Иначе кнопки
// просто не показываем, а вход по паролю работает как прежде.
const providers: Provider[] = [
  // "Вход по логину и паролю".
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Пароль", type: "password" },
    },
    authorize: async (credentials) => {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      // У соцаккаунтов пароля нет — по паролю их не пускаем.
      if (!user || !user.passwordHash) return null;

      const passwordOk = await bcrypt.compare(password, user.passwordHash);
      if (!passwordOk) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role ?? undefined,
      };
    },
  }),
];

if (process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET) {
  providers.push(
    Yandex({
      clientId: process.env.YANDEX_CLIENT_ID,
      clientSecret: process.env.YANDEX_CLIENT_SECRET,
    })
  );
}
if (process.env.VK_CLIENT_ID && process.env.VK_CLIENT_SECRET) {
  providers.push(
    VK({
      clientId: process.env.VK_CLIENT_ID,
      clientSecret: process.env.VK_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  // Доверяем заголовку хоста за обратным прокси хостинга (Timeweb, не-Vercel).
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,

  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      // Вход через соцсеть — находим/заводим пользователя в нашей базе.
      if (account && (account.provider === "yandex" || account.provider === "vk")) {
        const provider = account.provider;
        const p = (profile ?? {}) as Record<string, unknown>;
        const providerId = String(
          account.providerAccountId ?? p.sub ?? p.id ?? ""
        );
        const rawEmail =
          user?.email ??
          (p.default_email as string | undefined) ??
          (p.email as string | undefined) ??
          null;
        const email = rawEmail ? rawEmail.toLowerCase() : null;
        const name =
          user?.name ||
          (p.real_name as string | undefined) ||
          (p.name as string | undefined) ||
          "Пользователь";

        // Ищем по связке провайдер+id, затем по email (привязываем к своему).
        let dbUser = await prisma.user.findFirst({
          where: { oauthProvider: provider, oauthId: providerId },
        });
        if (!dbUser && email) {
          const byEmail = await prisma.user.findUnique({ where: { email } });
          if (byEmail) {
            dbUser = await prisma.user.update({
              where: { id: byEmail.id },
              data: { oauthProvider: provider, oauthId: providerId },
            });
          }
        }
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: email ?? `${provider}-${providerId}@auth.render.local`,
              name,
              oauthProvider: provider,
              oauthId: providerId,
              // role и passwordHash пустые — роль выберется на /welcome.
            },
          });
        }
        token.id = dbUser.id;
        token.role = dbUser.role ?? undefined;
      } else if (user) {
        // Вход по паролю.
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }

      // Подтягиваем роль из базы: после выбора на /welcome (trigger "update")
      // или если роль в токене ещё не проставлена (соцвход до выбора роли).
      // Для входа по паролю роль уже есть — лишнего запроса не делаем.
      if (token.id && (trigger === "update" || token.role == null)) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        token.role = fresh?.role ?? undefined;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
});
