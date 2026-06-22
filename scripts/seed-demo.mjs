import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const p = new PrismaClient();

// Демо-монтажёры для просмотра дизайна (каталог/лендинг). Помечены @render.demo.
const demos = [
  { name: "Алексей Громов", headline: "Монтажёр игровых нарезок", sections: ["GAMES", "MOBILE"], games: ["SAMP", "CS2"], city: "Москва", payMin: 50000, payMax: 90000, reels: [
    { url: "https://www.youtube.com/watch?v=9bZkp7q19f0", section: "GAMES" },
    { url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk", section: "MOBILE" },
    { url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ", section: "GAMES" },
  ] },
  { name: "Марина Светлова", headline: "Reels и Shorts под бренды", sections: ["MOBILE"], games: [], city: "Санкт-Петербург", payMin: 60000, payMax: 110000, reels: [
    { url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk", section: "MOBILE" },
  ] },
  { name: "Дмитрий Орлов", headline: "3D и моушн-дизайн", sections: ["CGI3D", "MOTION"], games: [], city: null, payMin: 90000, payMax: 160000, reels: [
    { url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ", section: "CGI3D" },
  ] },
  { name: "Игорь Власов", headline: "Длинные ролики для YouTube", sections: ["YOUTUBE"], games: [], city: "Казань", payMin: 40000, payMax: 70000, reels: [
    { url: "https://www.youtube.com/watch?v=L_jWHffIx5E", section: "YOUTUBE" },
  ] },
];

await p.user.deleteMany({ where: { email: { endsWith: "@render.demo" } } });
const hash = await bcrypt.hash("demo123456", 10);
let i = 0;
for (const d of demos) {
  i++;
  await p.user.create({
    data: {
      email: `demo${i}@render.demo`,
      name: d.name,
      role: "EDITOR",
      passwordHash: hash,
      editorProfile: {
        create: {
          headline: d.headline,
          sections: d.sections,
          games: d.games,
          city: d.city,
          remote: true,
          status: "SEEKING",
          payMin: d.payMin,
          payMax: d.payMax,
          payPeriod: "PER_MONTH",
          software: ["Premiere Pro", "After Effects"],
          skills: ["цветокор", "субтитры"],
          portfolio: {
            create: d.reels.map((r, idx) => ({
              url: r.url,
              section: r.section,
              title: "Шоурил",
              position: idx,
            })),
          },
        },
      },
    },
  });
}
console.log(`Создано демо-монтажёров: ${i}`);
await p.$disconnect();
