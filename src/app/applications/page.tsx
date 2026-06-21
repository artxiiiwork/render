import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ApplicationsBoard from "./ApplicationsBoard";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  // Страница заявок — для работодателя.
  if (session.user.role !== "EMPLOYER") {
    redirect("/dashboard");
  }

  const raw = await prisma.application.findMany({
    where: { vacancy: { employerId: session.user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      vacancy: { select: { id: true, title: true } },
      editor: {
        select: {
          name: true,
          editorProfile: {
            select: {
              id: true,
              avatarUrl: true,
              headline: true,
              portfolio: { select: { id: true, url: true, title: true } },
            },
          },
        },
      },
    },
  });

  // Готовим чистые данные для клиентской части (модальное окно).
  const applications = raw.map((a) => ({
    id: a.id,
    status: a.status,
    message: a.message,
    vacancyId: a.vacancy.id,
    vacancyTitle: a.vacancy.title,
    editor: {
      userId: a.editorId,
      name: a.editor.name,
      headline: a.editor.editorProfile?.headline ?? "",
      avatarUrl: a.editor.editorProfile?.avatarUrl ?? null,
      profileId: a.editor.editorProfile?.id ?? null,
      portfolio: a.editor.editorProfile?.portfolio ?? [],
    },
  }));

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/messages"
            className="text-muted transition-colors hover:text-foreground"
          >
            Сообщения
          </Link>
          <Link
            href="/dashboard"
            className="text-muted transition-colors hover:text-foreground"
          >
            ← В кабинет
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <span className="eyebrow">Входящие</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
          Заявки
        </h1>
        <p className="mt-3 text-muted">
          {applications.length > 0
            ? `Откликов: ${applications.length}. Нажмите на заявку, чтобы посмотреть.`
            : "Откликов пока нет."}
        </p>

        <div className="mt-6">
          <ApplicationsBoard applications={applications} />
        </div>
      </main>
    </div>
  );
}
