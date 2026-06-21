import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  Prisma,
  ContentFormat,
  WorkFormat,
  Employment,
} from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Pagination from "@/components/Pagination";
import {
  FORMAT_OPTIONS,
  FORMAT_LABELS,
  WORK_FORMAT_OPTIONS,
  WORK_FORMAT_LABELS,
  EMPLOYMENT_OPTIONS,
  EMPLOYMENT_LABELS,
  EMPLOYER_TYPE_LABELS,
  formatPay,
} from "@/lib/labels";

const PAGE_SIZE = 12;
const FORMAT_VALUES = FORMAT_OPTIONS.map((o) => o.value) as string[];
const WORK_VALUES = WORK_FORMAT_OPTIONS.map((o) => o.value) as string[];
const EMP_VALUES = EMPLOYMENT_OPTIONS.map((o) => o.value) as string[];

export default async function VacanciesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    format?: string;
    work?: string;
    employment?: string;
    q?: string;
    remote?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const sp = await searchParams;
  const activeFormat =
    sp.format && FORMAT_VALUES.includes(sp.format) ? sp.format : undefined;
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
  if (activeFormat) where.formats = { has: activeFormat as ContentFormat };
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
    format: activeFormat,
    work: activeWork,
    employment: activeEmployment,
    q,
    remote: onlyRemote ? "1" : undefined,
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo href="/dashboard" />
        <Link
          href="/dashboard"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← В кабинет
        </Link>
      </header>

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
            {[{ value: "", label: "Все форматы" }, ...FORMAT_OPTIONS].map(
              (opt) => (
                <label key={opt.value || "all"} className="cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value={opt.value}
                    defaultChecked={(activeFormat ?? "") === opt.value}
                    className="peer sr-only"
                  />
                  <span className="block rounded-full border border-border px-3 py-1.5 text-sm text-muted transition hover:border-accent/50 peer-checked:border-accent peer-checked:bg-accent/15 peer-checked:text-foreground">
                    {opt.label}
                  </span>
                </label>
              )
            )}
          </div>

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
          <p className="panel mt-6 p-8 text-center text-muted">
            Подходящих вакансий не нашли.
          </p>
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
                  className="panel flex flex-col p-6"
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
                    {v.formats.map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent"
                      >
                        {FORMAT_LABELS[f] ?? f}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted">
                      {v.city ? v.city : v.remote ? "Удалённо" : "—"}
                      {v.city && v.remote ? " · удалённо" : ""}
                    </span>
                    {pay && <span className="font-medium text-foreground">{pay}</span>}
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
