import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";
import MessageComposer from "../MessageComposer";
import MarkRead from "../MarkRead";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const me = session.user.id;
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      employer: {
        select: {
          name: true,
          employerProfile: { select: { displayName: true, logoUrl: true } },
        },
      },
      editor: {
        select: {
          name: true,
          editorProfile: { select: { id: true, avatarUrl: true } },
        },
      },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    notFound();
  }
  // Доступ — только участникам переписки.
  if (conversation.employerId !== me && conversation.editorId !== me) {
    redirect("/messages");
  }

  const iAmEmployer = conversation.employerId === me;
  const isSupport = conversation.isSupport;
  const otherName = isSupport
    ? "Поддержка RENDER"
    : iAmEmployer
      ? conversation.editor.name
      : (conversation.employer.employerProfile?.displayName ??
        conversation.employer.name);
  const otherAvatar = isSupport
    ? null
    : iAmEmployer
      ? conversation.editor.editorProfile?.avatarUrl
      : conversation.employer.employerProfile?.logoUrl;
  const editorProfileId =
    !isSupport && iAmEmployer ? conversation.editor.editorProfile?.id : null;

  return (
    <div className="flex h-full flex-col">
      {/* Отмечаем переписку прочитанной при открытии */}
      <MarkRead conversationId={conversation.id} />

      {/* Шапка чата */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-4">
        {isSupport ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a7 7 0 0 0-7 7v4a3 3 0 0 0 3 3h1v-7H7V9a5 5 0 0 1 10 0v3h-2v7h1a3 3 0 0 0 3-3V9a7 7 0 0 0-7-7Z" />
            </svg>
          </span>
        ) : (
          <Avatar src={otherAvatar} name={otherName} size={44} />
        )}
        {editorProfileId ? (
          <Link
            href={`/editors/${editorProfileId}`}
            className="font-display text-lg font-bold hover:text-accent"
          >
            {otherName}
          </Link>
        ) : (
          <p className="flex items-center gap-2 font-display text-lg font-bold">
            {otherName}
            {isSupport && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                Официально
              </span>
            )}
          </p>
        )}
      </div>

      {/* Лента сообщений */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-6">
        {conversation.messages.length === 0 ? (
          <p className="text-center text-sm text-muted">
            Сообщений пока нет. Напишите первым.
          </p>
        ) : (
          conversation.messages.map((m) => {
            const mine = m.senderId === me;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? "bg-accent text-on-accent"
                      : "border border-border bg-surface text-foreground/90"
                  }`}
                >
                  {m.text}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Поле ввода */}
      <div className="shrink-0 border-t border-border p-4">
        <MessageComposer conversationId={conversation.id} />
      </div>
    </div>
  );
}
