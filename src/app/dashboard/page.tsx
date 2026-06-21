// Личный кабинет после входа.
// Монтажёр видит свои отклики, работодатель — свои вакансии.
import Link from "next/link";
import Logo from "@/components/Logo";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import { getUnreadConversationIds, countNewApplications } from "@/lib/unread";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_STYLES,
  VACANCY_STATUS_LABELS,
} from "@/lib/labels";

// Маленький круглый счётчик-бейдж.
function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-on-accent">
      {count}
    </span>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isEditor = session.user.role === "EDITOR";

  // Данные кабинета под роль.
  const vacancies = isEditor
    ? []
    : await prisma.vacancy.findMany({
        where: { employerId: session.user.id },
        include: { _count: { select: { applications: true } } },
        orderBy: { updatedAt: "desc" },
      });

  const applications = isEditor
    ? await prisma.application.findMany({
        where: { editorId: session.user.id },
        include: { vacancy: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // id резюме монтажёра — чтобы дать ссылку «посмотреть моё резюме».
  const editorProfile = isEditor
    ? await prisma.editorProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
    : null;

  // Счётчики «нового» для бейджей.
  const unreadMessages = (await getUnreadConversationIds(session.user.id)).size;
  const newApplications = isEditor
    ? 0
    : await countNewApplications(session.user.id);

  // Админ видит ссылку на модерацию.
  const isAdmin =
    (
      await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true },
      })
    )?.isAdmin ?? false;

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/editors"
            className="text-muted transition-colors hover:text-foreground"
          >
            Монтажёры
          </Link>
          <Link
            href="/vacancies"
            className="text-muted transition-colors hover:text-foreground"
          >
            Вакансии
          </Link>
          {!isEditor && (
            <Link
              href="/applications"
              className="inline-flex items-center text-muted transition-colors hover:text-foreground"
            >
              Заявки
              <Badge count={newApplications} />
            </Link>
          )}
          <Link
            href="/messages"
            className="inline-flex items-center text-muted transition-colors hover:text-foreground"
          >
            Сообщения
            <Badge count={unreadMessages} />
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Админка
            </Link>
          )}
          <span className="text-muted/60">·</span>
          <span className="hidden text-muted sm:inline">{session.user.name}</span>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <span className="eyebrow">
          {isEditor ? "Кабинет монтажёра" : "Кабинет работодателя"}
        </span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
          Привет, {session.user.name}!
        </h1>

        {/* Быстрые действия */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/profile/edit" className="btn-accent px-5 py-2.5">
            {isEditor ? "Заполнить резюме" : "Заполнить профиль"}
          </Link>
          {isEditor ? (
            <>
              {editorProfile && (
                <Link
                  href={`/editors/${editorProfile.id}`}
                  className="rounded-full border border-border px-5 py-2.5 font-medium text-foreground transition hover:border-accent/60"
                >
                  Посмотреть моё резюме
                </Link>
              )}
              <Link
                href="/vacancies"
                className="rounded-full border border-border px-5 py-2.5 font-medium text-foreground transition hover:border-accent/60"
              >
                Найти вакансии
              </Link>
            </>
          ) : (
            <>
              <Link href="/vacancies/new" className="btn-accent px-5 py-2.5">
                Разместить вакансию
              </Link>
              <Link
                href="/editors"
                className="rounded-full border border-border px-5 py-2.5 font-medium text-foreground transition hover:border-accent/60"
              >
                Найти монтажёров
              </Link>
            </>
          )}
        </div>

        {/* Списки под роль */}
        {isEditor ? (
          <section className="mt-10">
            <span className="eyebrow">Мои отклики</span>
            {applications.length === 0 ? (
              <p className="panel mt-4 p-6 text-sm text-muted">
                Откликов пока нет.{" "}
                <Link href="/vacancies" className="text-accent hover:underline">
                  Посмотреть вакансии
                </Link>
                .
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {applications.map((a) => (
                  <Link
                    key={a.id}
                    href={`/vacancies/${a.vacancy.id}`}
                    className="panel flex items-center justify-between gap-3 p-5"
                  >
                    <span className="font-medium text-foreground">
                      {a.vacancy.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        APPLICATION_STATUS_STYLES[a.status]
                      }`}
                    >
                      {APPLICATION_STATUS_LABELS[a.status]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="mt-10">
            <span className="eyebrow">Мои вакансии</span>
            {vacancies.length === 0 ? (
              <p className="panel mt-4 p-6 text-sm text-muted">
                Вы ещё не разместили вакансий.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {vacancies.map((v) => (
                  <Link
                    key={v.id}
                    href={`/vacancies/${v.id}`}
                    className="panel flex items-center justify-between gap-3 p-5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {v.title}
                      </span>
                      <span className="text-sm text-muted">
                        Откликов: {v._count.applications}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        v.status === "OPEN"
                          ? "bg-green-500/15 text-green-300"
                          : "bg-white/5 text-muted"
                      }`}
                    >
                      {VACANCY_STATUS_LABELS[v.status]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
