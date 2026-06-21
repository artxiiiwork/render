import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ApplyForm from "./ApplyForm";
import ApplicationActions from "./ApplicationActions";
import VacancyStatusButton from "./VacancyStatusButton";
import {
  FORMAT_LABELS,
  WORK_FORMAT_LABELS,
  EMPLOYMENT_LABELS,
  EMPLOYER_TYPE_LABELS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_STYLES,
  formatPay,
} from "@/lib/labels";

export default async function VacancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const vacancy = await prisma.vacancy.findUnique({
    where: { id },
    include: {
      employer: {
        select: {
          name: true,
          employerProfile: {
            select: { displayName: true, type: true, channelUrl: true },
          },
        },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          editor: {
            select: { name: true, editorProfile: { select: { id: true } } },
          },
        },
      },
    },
  });

  if (!vacancy) {
    notFound();
  }

  const isOwner = vacancy.employerId === session.user.id;
  const isEditor = session.user.role === "EDITOR";
  const myApp = isEditor
    ? vacancy.applications.find((a) => a.editorId === session.user.id)
    : undefined;

  const pay = formatPay(vacancy.payMin, vacancy.payMax, vacancy.payPeriod);
  const employerName =
    vacancy.employer.employerProfile?.displayName ?? vacancy.employer.name;
  const employerType = vacancy.employer.employerProfile?.type;

  const rows: { label: string; value: string }[] = [
    { label: "Формат работы", value: WORK_FORMAT_LABELS[vacancy.workFormat] },
    { label: "Занятость", value: EMPLOYMENT_LABELS[vacancy.employment] },
  ];
  if (vacancy.formats.length > 0)
    rows.push({
      label: "Форматы",
      value: vacancy.formats.map((f) => FORMAT_LABELS[f] ?? f).join(", "),
    });
  if (vacancy.software.length > 0)
    rows.push({ label: "Софт", value: vacancy.software.join(", ") });
  if (vacancy.skills.length > 0)
    rows.push({ label: "Навыки", value: vacancy.skills.join(", ") });
  rows.push({
    label: "Где",
    value: vacancy.city
      ? vacancy.remote
        ? `${vacancy.city} · удалённо`
        : vacancy.city
      : vacancy.remote
        ? "Удалённо"
        : "—",
  });
  if (pay) rows.push({ label: "Оплата", value: pay });

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo href="/dashboard" />
        <Link
          href="/vacancies"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← К каталогу
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            {vacancy.title}
          </h1>
          {vacancy.status === "CLOSED" && (
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-muted">
              Закрыта
            </span>
          )}
        </div>
        <p className="mt-2 text-muted">
          {employerName}
          {employerType ? ` · ${EMPLOYER_TYPE_LABELS[employerType]}` : ""}
          {vacancy.employer.employerProfile?.channelUrl && (
            <>
              {" · "}
              <a
                href={vacancy.employer.employerProfile.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                канал/сайт
              </a>
            </>
          )}
        </p>

        {isOwner && (
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/vacancies/${vacancy.id}/edit`}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-accent/60"
            >
              Редактировать
            </Link>
            <VacancyStatusButton vacancyId={vacancy.id} status={vacancy.status} />
          </div>
        )}

        {/* Характеристики */}
        <div className="panel mt-8 p-6">
          <span className="eyebrow">Условия</span>
          <dl className="mt-4 space-y-3">
            {rows.map((row) => (
              <div key={row.label} className="flex gap-4 text-sm">
                <dt className="w-32 shrink-0 text-muted">{row.label}</dt>
                <dd className="text-foreground/90">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Описание */}
        <div className="panel mt-6 p-6">
          <span className="eyebrow">Описание</span>
          <p className="mt-3 whitespace-pre-wrap text-foreground/90">
            {vacancy.description}
          </p>
        </div>

        {/* Отклик — для монтажёра */}
        {isEditor && !isOwner && (
          <div className="panel mt-6 p-6">
            <span className="eyebrow">Отклик</span>
            {myApp ? (
              <div className="mt-3">
                <p className="flex items-center gap-2 text-sm text-muted">
                  Вы откликнулись.
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      APPLICATION_STATUS_STYLES[myApp.status]
                    }`}
                  >
                    {APPLICATION_STATUS_LABELS[myApp.status]}
                  </span>
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/80">
                  {myApp.message}
                </p>
              </div>
            ) : vacancy.status === "OPEN" ? (
              <div className="mt-3">
                <ApplyForm vacancyId={vacancy.id} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Вакансия закрыта — откликнуться нельзя.
              </p>
            )}
          </div>
        )}

        {/* Отклики — для работодателя-владельца */}
        {isOwner && (
          <div className="mt-6">
            <span className="eyebrow">
              Отклики ({vacancy.applications.length})
            </span>
            {vacancy.applications.length === 0 ? (
              <p className="panel mt-4 p-6 text-sm text-muted">
                Откликов пока нет.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {vacancy.applications.map((a) => (
                  <div key={a.id} className="panel p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {a.editor.editorProfile ? (
                          <Link
                            href={`/editors/${a.editor.editorProfile.id}`}
                            className="font-medium text-foreground hover:text-accent"
                          >
                            {a.editor.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-foreground">
                            {a.editor.name}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            APPLICATION_STATUS_STYLES[a.status]
                          }`}
                        >
                          {APPLICATION_STATUS_LABELS[a.status]}
                        </span>
                      </div>
                      <ApplicationActions
                        applicationId={a.id}
                        status={a.status}
                      />
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/80">
                      {a.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
