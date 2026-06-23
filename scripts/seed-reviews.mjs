import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const editors = await prisma.editorProfile.findMany({
  include: { user: { select: { id: true, name: true, email: true } } },
  orderBy: { createdAt: "asc" },
});
const demo = editors.filter((e) => e.user.email.endsWith("@render.demo"));
console.log(
  "demo editors:",
  demo.map((e) => `${e.user.name} <${e.user.email}> profile=${e.id}`)
);

if (demo.length < 2) {
  console.log("not enough demo editors");
  process.exit(0);
}

const targets = demo.slice(0, 3);
const authors = demo;

const samples = [
  { rating: 5, comment: "Сделал монтаж за день, попадание в референс 10/10. Однозначно ещё обратимся." },
  { rating: 5, comment: "Отличная динамика, чистый звук, всё в срок." },
  { rating: 4, comment: "Качественно, пару правок внесли — реагировал быстро." },
];

let created = 0;
for (const t of targets) {
  const possibleAuthors = authors.filter((a) => a.user.id !== t.user.id);
  for (let i = 0; i < Math.min(3, possibleAuthors.length); i++) {
    const a = possibleAuthors[i];
    const s = samples[i % samples.length];
    await prisma.conversation
      .upsert({
        where: {
          employerId_editorId: { employerId: a.user.id, editorId: t.user.id },
        },
        create: { employerId: a.user.id, editorId: t.user.id },
        update: {},
      })
      .catch(() => {});
    await prisma.review.upsert({
      where: {
        authorId_targetId: { authorId: a.user.id, targetId: t.user.id },
      },
      create: {
        authorId: a.user.id,
        targetId: t.user.id,
        rating: s.rating,
        comment: s.comment,
      },
      update: { rating: s.rating, comment: s.comment },
    });
    created++;
  }
}
console.log("reviews upserted:", created);
await prisma.$disconnect();
