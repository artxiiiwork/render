// Регистрация вебхука Telegram-бота.
// Запуск:  node scripts/set-telegram-webhook.mjs https://ВАШ-САЙТ
//          node scripts/set-telegram-webhook.mjs info      (показать статус)
//          node scripts/set-telegram-webhook.mjs delete    (снять вебхук)
//
// Берёт TELEGRAM_BOT_TOKEN и TELEGRAM_WEBHOOK_SECRET из .env.
import { readFileSync } from "fs";

// Простейшее чтение .env (без зависимостей).
try {
  const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!TOKEN) {
  console.error("Нет TELEGRAM_BOT_TOKEN в .env");
  process.exit(1);
}
const API = `https://api.telegram.org/bot${TOKEN}`;
const arg = process.argv[2];

async function call(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return res.json();
}

if (arg === "info") {
  console.log(JSON.stringify(await call("getWebhookInfo"), null, 2));
} else if (arg === "delete") {
  console.log(JSON.stringify(await call("deleteWebhook", { drop_pending_updates: false }), null, 2));
} else if (arg && arg.startsWith("http")) {
  const url = `${arg.replace(/\/$/, "")}/api/telegram/webhook`;
  const body = { url, allowed_updates: ["message"] };
  if (SECRET) body.secret_token = SECRET;
  console.log("setWebhook →", url);
  console.log(JSON.stringify(await call("setWebhook", body), null, 2));
} else {
  console.log("Использование: node scripts/set-telegram-webhook.mjs <https://сайт | info | delete>");
}
