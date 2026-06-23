"use server";

import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TELEGRAM_BOT_USERNAME, telegramEnabled } from "@/lib/telegram";

// Сгенерировать одноразовый код привязки и вернуть ссылку на бота.
// Пользователь открывает ссылку, жмёт Start — бот ловит /start <код> и
// привязывает чат к этому аккаунту (см. webhook).
export async function createTelegramLink() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };
  if (!telegramEnabled() || !TELEGRAM_BOT_USERNAME) {
    return { error: "Бот уведомлений пока не настроен" };
  }

  const code = randomBytes(12).toString("hex");
  await prisma.user.update({
    where: { id: session.user.id },
    data: { telegramLinkCode: code },
  });

  const url = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${code}`;
  return { ok: true, url };
}

// Отключить уведомления — стираем привязку чата.
export async function disconnectTelegram() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { telegramChatId: null, telegramLinkCode: null },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
