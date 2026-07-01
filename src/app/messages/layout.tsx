import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUnreadConversationIds } from "@/lib/unread";
import ConversationList from "./ConversationList";

// Каркас раздела «Сообщения»: слева список переписок, справа — выбранный чат.
export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!session.user.role) {
    redirect("/welcome");
  }
  const me = session.user.id;

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ employerId: me }, { editorId: me }] },
    orderBy: { updatedAt: "desc" },
    include: {
      employer: {
        select: {
          name: true,
          employerProfile: { select: { displayName: true, logoUrl: true } },
        },
      },
      editor: {
        select: { name: true, editorProfile: { select: { avatarUrl: true } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const unread = await getUnreadConversationIds(me);
  const items = conversations.map((c) => {
    const iAmEmployer = c.employerId === me;
    const name = c.isSupport
      ? "Поддержка RENDER"
      : iAmEmployer
        ? c.editor.name
        : (c.employer.employerProfile?.displayName ?? c.employer.name);
    const avatar = c.isSupport
      ? null
      : iAmEmployer
        ? (c.editor.editorProfile?.avatarUrl ?? null)
        : (c.employer.employerProfile?.logoUrl ?? null);
    return {
      id: c.id,
      name,
      avatar,
      last: c.messages[0]?.text ?? null,
      unread: unread.has(c.id),
      support: c.isSupport,
    };
  });

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between px-6 py-5 sm:px-10">
        <Logo href="/dashboard" />
        <Link
          href="/dashboard"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← В кабинет
        </Link>
      </header>

      <div className="min-h-0 flex-1 px-4 pb-4 sm:px-6">
        <div className="mx-auto flex h-full max-w-6xl overflow-hidden rounded-2xl border border-border">
          <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface/40 sm:w-72">
            <ConversationList items={items} />
          </aside>
          <section className="flex min-w-0 flex-1 flex-col">{children}</section>
        </div>
      </div>
    </div>
  );
}
