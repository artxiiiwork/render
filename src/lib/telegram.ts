// Telegram-бот уведомлений. Шлёт личные сообщения пользователям, которые
// привязали свой Telegram (через /start <код> у бота). Всё «мягкое»: если бот не
// настроен или пользователь не привязан — просто молча ничего не делаем, основное
// действие (отправка сообщения, отклик) не должно падать из-за Telegram.

import { prisma } from "@/lib/prisma";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;

export function telegramEnabled(): boolean {
  return !!API;
}

export const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? "";

type InlineButton = { text: string; url: string };

// Низкоуровневый вызов метода Bot API. Возвращает разобранный JSON или null.
export async function telegramCall(
  method: string,
  body: Record<string, unknown>
): Promise<unknown> {
  if (!API) return null;
  try {
    const res = await fetch(`${API}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    console.error(`telegram ${method} failed`, e);
    return null;
  }
}

// Отправить текст в конкретный чат (chatId известен).
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  button?: InlineButton
): Promise<void> {
  await telegramCall("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    ...(button
      ? { reply_markup: { inline_keyboard: [[button]] } }
      : {}),
  });
}

// Уведомить пользователя по его id (если он привязал Telegram). Никогда не бросает.
export async function notifyTelegram(
  userId: string,
  text: string,
  button?: InlineButton
): Promise<void> {
  if (!API) return;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true },
    });
    if (!user?.telegramChatId) return;
    await sendTelegramMessage(user.telegramChatId, text, button);
  } catch (e) {
    console.error("notifyTelegram failed", e);
  }
}
