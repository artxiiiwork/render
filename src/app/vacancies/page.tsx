import Link from "next/link";
import type { Metadata } from "next";
import { Prisma, WorkFormat, Employment } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PublicHeader from "@/components/PublicHeader";
import Pagination from "@/components/Pagination";
import MascotSlot from "@/components/MascotSlot";
import {
  WORK_FORMAT_OPTIONS,
  WORK_FORMAT_LABELS,
  EMPLOYMENT_OPTIONS,
  EMPLOYMENT_LABELS,
  EMPLOYER_TYPE_LABELS,
  formatPay,
} from "@/lib/labels";
import {
  SECTION_OPTIONS,
  SECTION_LABELS,
  SECTION_VALUES,
  GAME_OPTIONS,
  GAME_VALUES,
  GAMES_SECTION,
} from "@/lib/taxonomy";

const PAGE_SIZE = 12;
const WORK_VALUES = WORK_FORMAT_OPTIONS.map((o) => o.value) as string[];
const EMP_VALUES = EMPLOYMENT_OPTIONS.map((o) => o.value) as string[];

export const metadata: Metadata = {
  title: "Вакансии для видеомонтажёров",
  description:
    "Открытые вакансии видеомонтажёра: штат, постоянное сотрудничество, проекты. Фильтры по нише и формату работы.",
  alternates: { canonical: "/vacancies" },
};

export default async function VacanciesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
    game?: string;
    work?: string;
    employment?: string;
    q?: string;
    remote?: string;
    page?: string;
  }>;
}) {
  // Каталог вакансий публичный — виден и без входа.
  const session = await auth();
  const authed = !!session?.user?.id;

  const sp = await searchParams;
  const activeSection =
    sp.section && SECTION_VALUES.includes(sp.section) ? sp.section : undefined;
  const activeGame =
    activeSection === GAMES_SECTION && sp.game && GAME_VALUES.includes(sp.game)
      ? sp.game
      : undefined;
  const activeWork =
    sp.work && WORK_VALUES.includes(sp.work) ? sp.work : undefined;
  const activeEmployment =
    sp.employment && EMP_VALUES.includes(sp.employment)
      ? sp.employment
      : undefined;
  const q = sp.q?.trim() || undefined;
  const onlyRemote = sp.remote === "1";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.VacancyWhereInput = { status: "OPEN" };
  if (activeSection) where.sections = { has: activeSection };
  if (activeGame) where.games = { has: activeGame };
  if (activeWork) where.workFormat = activeWork as WorkFormat;
  if (activeEmployment) where.employment = activeEmployment as Employment;
  if (onlyRemote) where.remote = true;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const total = await prisma.vacancy.count({ where });
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const vacancies = await prisma.vacancy.findMany({
    where,
    include: {
      employer: {
        select: {
          name: true,
          employerProfile: { select: { displayName: true, type: true } },
        },
      },
    },
    // Продвигаемые вакансии — выше (задел под платное продвижение).
    orderBy: [{ isPromoted: "desc" }, { updatedAt: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const extraParams = {
    section: activeSection,
    game: activeGame,
    work: activeWork,
    employment: activeEmployment,
    q,
    remote: onlyRemote ? "1" : undefined,
  };

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader authed={authed} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <span className="eyebrow">Каталог</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
          Вакансии
        </h1>
        <p className="mt-3 text-muted">
          {total > 0 ? `Открытых вакансий: ${total}` : "Открытых вакансий пока нет"}
        </p>

        <form method="get" action="/vacancies" className="panel mt-6 space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            {[{ value: "", label: "Все разделы" }, ...SECTION_OPTIONS].map(
              (opt) => (
                <label key={opt.value || "all"} className="cursor-pointer">
                  <input
                    type="radio"
                    name="section"
                    value={opt.value}
                    defaultChecked={(activeSection ?? "") === opt.value}
                    className="peer sr-only"
                  />
                  <span className="block rounded-full border border-border px-3 py-1.5 text-sm text-muted transition hover:border-accent/50 peer-checked:border-accent peer-checked:bg-accent/15 peer-checked:text-foreground">
                    {opt.label}
                  </span>
                </label>
              )
            )}
          </div>

          {activeSection === GAMES_SECTION && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              {[{ value: "", label: "Все игры" }, ...GAME_OPTIONS].map((opt) => (
                <label key={opt.value || "allgames"} className="cursor-pointer">
                  <input
                    type="radio"
                    name="game"
                    value={opt.value}
                    defaultChecked={(activeGame ?? "") === opt.value}
                    className="peer sr-only"
                  />
                  <span className="block rounded-full border border-border px-3 py-1.5 text-sm text-muted transition hover:border-accent/50 peer-checked:border-accent peer-checked:bg-accent/15 peer-checked:text-foreground">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Поиск по заголовку и описанию"
              className="field"
            />
            <div className="grid grid-cols-2 gap-3">
              <select name="work" defaultValue={activeWork ?? ""} className="field">
                <option value="">Любой формат работы</option>
                {WORK_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                name="employment"
                defaultValue={activeEmployment ?? ""}
                className="field"
              >
                <option value="">Любая занятость</option>
                {EMPLOYMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn-accent px-5 py-2 text-sm">
              Найти
            </button>
            <Link
              href="/vacancies"
              className="rounded-full border border-border px-5 py-2 text-sm text-muted transition hover:border-accent/60 hover:text-foreground"
            >
              Сбросить
            </Link>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/90">
              <input
                type="checkbox"
                name="remote"
                value="1"
                defaultChecked={onlyRemote}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Только удалёнка
            </label>
          </div>
        </form>

        {vacancies.length === 0 ? (
          <div className="panel mt-6 flex flex-col items-center gap-4 p-10">
            <MascotSlot caption="Подходящих вакансий не нашли." />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {vacancies.map((v) => {
              const pay = formatPay(v.payMin, v.payMax, v.payPeriod);
              const employerName =
                v.employer.employerProfile?.displayName ?? v.employer.name;
              const employerType = v.employer.employerProfile?.type;
              return (
                <Link
                  key={v.id}
                  href={`/vacancies/${v.id}`}
                  className="panel panel-link flex flex-col p-6"
                >
                  <h2 className="font-display text-lg font-bold">{v.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {employerName}
                    {employerType ? ` · ${EMPLOYER_TYPE_LABELS[employerType]}` : ""}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-foreground/80">
                      {WORK_FORMAT_LABELS[v.workFormat]}
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-foreground/80">
                      {EMPLOYMENT_LABELS[v.employment]}
                    </span>
                    {v.sections.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent-light"
                      >
                        {SECTION_LABELS[s] ?? s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted">
                      {v.city ? v.city : v.remote ? "Удалённо" : "—"}
                      {v.city && v.remote ? " · удалённо" : ""}
                    </span>
                    {pay && (
                      <span className="num font-medium text-foreground">{pay}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <Pagination
          basePath="/vacancies"
          page={page}
          totalPages={totalPages}
          extraParams={extraParams}
        />
      </main>
    </div>
  );
}
