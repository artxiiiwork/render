// Вебхук Telegram: сюда бот присылает входящие сообщения от пользователей.
// Главное — обработать «/start <код>» для привязки чата к аккаунту RENDER.
// Защита: Telegram присылает наш секрет в заголовке X-Telegram-Bot-Api-Secret-Token.

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // Проверяем секрет (если он задан в окружении).
  if (WEBHOOK_SECRET) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: {
    message?: { text?: string; chat?: { id?: number | string } };
  };
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const text = update.message?.text?.trim();
  const chatId = update.message?.chat?.id;
  if (!text || chatId == null) {
    return NextResponse.json({ ok: true });
  }
  const chatIdStr = String(chatId);

  // /start <код> — привязка аккаунта.
  if (text.startsWith("/start")) {
    const code = text.split(/\s+/)[1];
    if (!code) {
      await sendTelegramMessage(
        chatId,
        "Привет! Это бот уведомлений RENDER 🎬\n\n" +
          "Сюда приходят уведомления с площадки: новые сообщения в чате и отклики на вакансии.\n\n" +
          "Чтобы привязать аккаунт: зайдите в личный кабинет на сайте → блок «Уведомления в Telegram» → «Подключить».\n\n" +
          "Отвязать уведомления — команда /stop."
      );
      return NextResponse.json({ ok: true });
    }

    const user = await prisma.user.findUnique({
      where: { telegramLinkCode: code },
      select: { id: true },
    });
    if (!user) {
      await sendTelegramMessage(
        chatId,
        "Код устарел или не найден. Откройте кабинет на сайте и нажмите «Подключить» заново."
      );
      return NextResponse.json({ ok: true });
    }

    try {
      // Освобождаем этот chatId, если он был привязан к другому аккаунту.
      await prisma.user.updateMany({
        where: { telegramChatId: chatIdStr, NOT: { id: user.id } },
        data: { telegramChatId: null },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { telegramChatId: chatIdStr, telegramLinkCode: null },
      });
      await sendTelegramMessage(
        chatId,
        "✅ Ваш аккаунт привязан!\n\n" +
          "Теперь сюда будут приходить уведомления RENDER: новые сообщения в чате и отклики на вакансии.\n\n" +
          "Отвязать уведомления — команда /stop."
      );
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        await sendTelegramMessage(
          chatId,
          "Этот Telegram уже привязан к другому аккаунту RENDER."
        );
      } else {
        console.error("telegram link failed", e);
        await sendTelegramMessage(
          chatId,
          "Не получилось подключить. Попробуйте ещё раз чуть позже."
        );
      }
    }
    return NextResponse.json({ ok: true });
  }

  // /stop — отключить уведомления.
  if (text.startsWith("/stop")) {
    await prisma.user.updateMany({
      where: { telegramChatId: chatIdStr },
      data: { telegramChatId: null },
    });
    await sendTelegramMessage(
      chatId,
      "Уведомления отключены. Включить снова можно в кабинете на сайте."
    );
    return NextResponse.json({ ok: true });
  }

  // На любые другие сообщения — короткая подсказка.
  await sendTelegramMessage(
    chatId,
    "Я бот уведомлений RENDER. Управление — в личном кабинете на сайте. Команда /stop отключает уведомления."
  );
  return NextResponse.json({ ok: true });
}
