import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";
import { VACANCY_STATUS_LABELS } from "@/lib/labels";
import AdminDeleteButton from "./AdminDeleteButton";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  // Не админ — на админку не пускаем.
  if (!me?.isAdmin) {
    redirect("/dashboard");
  }

  const [editors, vacancies, userCount] = await Promise.all([
    prisma.editorProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { portfolio: true } },
      },
    }),
    prisma.vacancy.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        employer: { select: { name: true, email: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.user.count(),
  ]);

  const stats = [
    { label: "Пользователей", value: userCount },
    { label: "Резюме", value: editors.length },
    { label: "Вакансий", value: vacancies.length },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href="/dashboard"
          className="font-display text-2xl font-black tracking-[0.15em] text-accent"
        >
          RENDER
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← В кабинет
        </Link>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <span className="eyebrow">Только для администратора</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
          Модерация
        </h1>

        {/* Сводка */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="panel p-5 text-center">
              <p className="font-display text-3xl font-extrabold">{s.value}</p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Резюме */}
        <section className="mt-10">
          <span className="eyebrow">Резюме монтажёров</span>
          {editors.length === 0 ? (
            <p className="panel mt-4 p-6 text-sm text-muted">Резюме пока нет.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {editors.map((e) => (
                <div key={e.id} className="panel flex items-center gap-4 p-4">
                  <Avatar src={e.avatarUrl} name={e.user.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {e.user.name}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {e.headline} · {e.user.email} · роликов:{" "}
                      {e._count.portfolio}
                    </p>
                  </div>
                  <Link
                    href={`/editors/${e.id}`}
                    className="shrink-0 rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent/60"
                  >
                    Открыть
                  </Link>
                  <AdminDeleteButton
                    id={e.id}
                    kind="editor"
                    label={`Резюме: ${e.user.name}`}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Вакансии */}
        <section className="mt-10">
          <span className="eyebrow">Вакансии</span>
          {vacancies.length === 0 ? (
            <p className="panel mt-4 p-6 text-sm text-muted">Вакансий пока нет.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {vacancies.map((v) => (
                <div key={v.id} className="panel flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {v.title}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {v.employer.name} · {v.employer.email} · откликов:{" "}
                      {v._count.applications} · {VACANCY_STATUS_LABELS[v.status]}
                    </p>
                  </div>
                  <Link
                    href={`/vacancies/${v.id}`}
                    className="shrink-0 rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent/60"
                  >
                    Открыть
                  </Link>
                  <AdminDeleteButton
                    id={v.id}
                    kind="vacancy"
                    label={`Вакансия: ${v.title}`}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
