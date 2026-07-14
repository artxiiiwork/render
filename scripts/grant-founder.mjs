// Выдать (или снять) бейдж «Основатель» монтажёру по email.
// Запуск:  node scripts/grant-founder.mjs user@mail.ru
//          node scripts/grant-founder.mjs user@mail.ru --revoke
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2];
const revoke = process.argv.includes("--revoke");

if (!email) {
  console.log("Использование: node scripts/grant-founder.mjs <email> [--revoke]");
  process.exit(1);
}

const user = await prisma.user.findUnique({
  where: { email: email.toLowerCase() },
  select: { id: true, name: true, editorProfile: { select: { id: true } } },
});
if (!user) {
  console.error(`Пользователь ${email} не найден`);
  process.exit(1);
}
if (!user.editorProfile) {
  console.error(`У ${email} нет резюме монтажёра — бейдж выдаётся монтажёрам`);
  process.exit(1);
}

await prisma.editorProfile.update({
  where: { id: user.editorProfile.id },
  data: { isFounder: !revoke },
});
console.log(
  `${revoke ? "Снят" : "Выдан"} бейдж «Основатель»: ${user.name} <${email}>`
);
await prisma.$disconnect();
