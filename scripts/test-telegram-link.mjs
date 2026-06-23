import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const code = "testcode_" + Math.random().toString(36).slice(2, 8);
const fakeChatId = 123456789;

const user = await prisma.user.findFirst({
  where: { email: "demo1@render.demo" },
  select: { id: true },
});
if (!user) {
  console.log("demo1 not found");
  process.exit(1);
}

await prisma.user.update({
  where: { id: user.id },
  data: { telegramLinkCode: code, telegramChatId: null },
});
console.log("set linkCode:", code, "for user", user.id);

// Симулируем приход апдейта от Telegram на наш вебхук.
const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
const res = await fetch("http://localhost:3000/api/telegram/webhook", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-telegram-bot-api-secret-token": secret,
  },
  body: JSON.stringify({
    message: { text: `/start ${code}`, chat: { id: fakeChatId } },
  }),
});
console.log("webhook status:", res.status, await res.text());

const after = await prisma.user.findUnique({
  where: { id: user.id },
  select: { telegramChatId: true, telegramLinkCode: true },
});
console.log("after link:", after);

// Проверим защиту: неверный секрет → 401.
const bad = await fetch("http://localhost:3000/api/telegram/webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-telegram-bot-api-secret-token": "wrong" },
  body: JSON.stringify({ message: { text: "/start x", chat: { id: 1 } } }),
});
console.log("bad-secret status (ожидаем 401):", bad.status);

// Прибираем тестовую привязку.
await prisma.user.update({
  where: { id: user.id },
  data: { telegramChatId: null, telegramLinkCode: null },
});
console.log("cleaned up");
await prisma.$disconnect();
