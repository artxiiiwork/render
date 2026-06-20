// Настройки "охранника" сайта (Auth.js / NextAuth).
// Здесь описано, как проверяется вход по email + паролю.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Доверяем заголовку хоста за обратным прокси хостинга (Timeweb и любой
  // не-Vercel). Без этого Auth.js v5 отклоняет запросы (UntrustedHost) и вход
  // не работает. Внешний адрес у нас всегда за прокси хостинга — это безопасно.
  trustHost: true,
  // Сессию храним в защищённом cookie (а не в базе) — это просто и быстро.
  session: { strategy: "jwt" },
  // Куда отправлять неавторизованных — на нашу страницу входа.
  pages: { signIn: "/login" },

  providers: [
    // "Вход по логину и паролю".
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      // Эта функция решает: впускать пользователя или нет.
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Ищем пользователя по email.
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        // Сверяем введённый пароль с зашифрованным "отпечатком" в базе.
        const passwordOk = await bcrypt.compare(password, user.passwordHash);
        if (!passwordOk) return null;

        // Всё совпало — возвращаем данные пользователя (без пароля).
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // Кладём id и роль в "пропуск" (токен), чтобы потом знать, кто вошёл.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    // Прокидываем id и роль в данные сессии, доступные на страницах.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
