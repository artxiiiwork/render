import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const email = process.argv[2];
if (!email) {
  console.error("Использование: node scripts/grant-admin.mjs <email>");
  process.exit(1);
}
const user = await p.user.update({
  where: { email: email.toLowerCase() },
  data: { isAdmin: true },
  select: { email: true, name: true, isAdmin: true },
});
console.log("Готово:", JSON.stringify(user));
await p.$disconnect();
