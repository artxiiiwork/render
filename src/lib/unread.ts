import { prisma } from "@/lib/prisma";

// Переписки, где есть непрочитанные для пользователя сообщения.
// «Непрочитано» = последнее сообщение от собеседника и пришло позже,
// чем пользователь последний раз открывал эту переписку.
export async function getUnreadConversationIds(me: string): Promise<Set<string>> {
  const convos = await prisma.conversation.findMany({
    where: { OR: [{ employerId: me }, { editorId: me }] },
    select: {
      id: true,
      employerId: true,
      editorId: true,
      employerLastReadAt: true,
      editorLastReadAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, senderId: true },
      },
    },
  });

  const unread = new Set<string>();
  for (const c of convos) {
    const last = c.messages[0];
    if (!last || last.senderId === me) continue;
    const myRead = c.employerId === me ? c.employerLastReadAt : c.editorLastReadAt;
    if (!myRead || last.createdAt > myRead) unread.add(c.id);
  }
  return unread;
}

// Сколько новых (ещё не просмотренных) откликов на вакансиях работодателя.
export async function countNewApplications(employerId: string): Promise<number> {
  return prisma.application.count({
    where: { status: "NEW", vacancy: { employerId } },
  });
}
