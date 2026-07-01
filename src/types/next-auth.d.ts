// Сообщаем TypeScript, что у нашего пользователя и сессии есть поля id и role.
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // Роль может отсутствовать сразу после соцвхода (до выбора на /welcome).
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
