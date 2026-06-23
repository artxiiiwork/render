import Link from "next/link";
import type { Metadata } from "next";
import { Prisma, WorkFormat, Employment } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Logo from "@/components/Logo";
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
  GAME_LABELS,
  GAME_VALUES,
  GAMES_SECTION,
} from "@/lib/taxonomy";

const PAGE_SIZE = 12;
const WORK_VALUES = WORK_FORMAT_OPTIONS.map((o) => o.value) as string[];
const EMP_VALUES = EMPLOYMENT_OPTIONS.map((o) => o.value) as string[];

export const metadata: Metadata = {
  title: "Вакансии для видеомонтажёров",
  description:
    "Открытые вакансии видеомонтажёра: штат, постоянное сотрудничество, проекты. Фильтры по нише, формату работы и ставке.",
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
    pay_from?: string;
    pay_to?: string;
    remote?: string;
    sort?: string;
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
  const payFrom = sp.pay_from ? Number(sp.pay_from) : undefined;
  const payTo = sp.pay_to ? Number(sp.pay_to) : undefined;
  const onlyRemote = sp.remote === "1";
  const sort = sp.sort || "relevant";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.VacancyWhereInput = { status: "OPEN" };
  if (activeSection) where.sections = { has: activeSection };
  if (activeGame) where.games = { has: activeGame };
  if (activeWork) where.workFormat = activeWork as WorkFormat;
  if (activeEmployment) where.employment = activeEmployment as Employment;
  if (onlyRemote) where.remote = true;
  if (payFrom != null || payTo != null) {
    where.payMin = {};
    if (payFrom != null) where.payMin.gte = payFrom;
    if (payTo != null) where.payMin.lte = payTo;
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.VacancyOrderByWithRelationInput[] =
    sort === "pay_desc"
      ? [{ payMin: { sort: "desc", nulls: "last" } }]
      : sort === "pay_asc"
        ? [{ payMin: { sort: "asc", nulls: "last" } }]
        : // Продвигаемые вакансии — выше (задел под платное продвижение).
          [{ isPromoted: "desc" }, { updatedAt: "desc" }];

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
    orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  // Подписи активного раздела/игры для заголовка.
  const sectionLabel = activeSection ? SECTION_LABELS[activeSection] : null;
  const gameLabel = activeGame ? GAME_LABELS[activeGame] : null;

  const extraParams = {
    section: activeSection,
    game: activeGame,
    work: activeWork,
    employment: activeEmployment,
    q,
    pay_from: payFrom != null ? String(payFrom) : undefined,
    pay_to: payTo != null ? String(payTo) : undefined,
    remote: onlyRemote ? "1" : undefined,
    sort: sort !== "relevant" ? sort : undefined,
  };

  const sectionTabBase =
    "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition";

  return (
    <div className="flex min-h-full flex-col">
      <form method="get" action="/vacancies">
        <input type="hidden" name="section" value={activeSection ?? ""} />
        <input type="hidden" name="game" value={activeGame ?? ""} />

        {/* Топ-бар: лого + поиск + роль-тоггл */}
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
            <Logo href="/" size={32} />
            <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
              <input
                type="text"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Вакансия, формат, ниша…"
                className="field"
              />
            </div>
            <div className="flex rounded-xl border border-border p-0.5">
              <Link
                href="/editors"
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-muted transition hover:text-foreground"
              >
                Ищу монтажёра
              </Link>
              <span className="rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-on-accent">
                Я монтажёр
              </span>
            </div>
            {authed ? (
              <Link
                href="/dashboard"
                className="rounded-lg border border-border px-3.5 py-2 text-sm text-foreground transition hover:border-accent/60"
              >
                В кабинет
              </Link>
            ) : (
              <Link href="/register" className="btn-accent px-3.5 py-2 text-sm">
                Регистрация
              </Link>
            )}
          </div>
        </header>

        {/* Лента разделов с иконками */}
        <nav className="border-b border-border">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 py-2">
            <Link
              href="/vacancies"
              className={`${sectionTabBase} ${
                !activeSection
                  ? "bg-accent/15 text-foreground"
                  : "text-muted hover:bg-white/5"
              }`}
            >
              Все
            </Link>
            {SECTION_OPTIONS.map((s) => (
              <Link
                key={s.value}
                href={`/vacancies?section=${s.value}`}
                className={`${sectionTabBase} ${
                  activeSection === s.value
                    ? "bg-accent/15 text-foreground"
                    : "text-muted hover:bg-white/5"
                }`}
              >
                <span aria-hidden="true">{s.icon}</span>
                {s.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Подстрока игр — только в разделе «Игры» */}
        {activeSection === GAMES_SECTION && (
          <div className="border-b border-border bg-surface/40">
            <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-6 py-2.5">
              <span className="shrink-0 text-xs uppercase tracking-wider text-faint">
                Игра
              </span>
              <Link
                href="/vacancies?section=GAMES"
                className={`shrink-0 rounded-full border px-3 py-1 text-sm transition ${
                  !activeGame
                    ? "border-accent bg-accent/15 text-foreground"
                    : "border-border text-muted hover:border-accent/50"
                }`}
              >
                Все игры
              </Link>
              {GAME_OPTIONS.map((g) => (
                <Link
                  key={g.value}
                  href={`/vacancies?section=GAMES&game=${g.value}`}
                  className={`shrink-0 rounded-full border px-3 py-1 text-sm transition ${
                    activeGame === g.value
                      ? "border-accent bg-accent/15 text-foreground"
                      : "border-border text-muted hover:border-accent/50"
                  }`}
                >
                  {g.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Сайдбар фильтров + основная сетка */}
        <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[230px_1fr]">
          <aside className="space-y-6">
            {/* Формат работы */}
            <div>
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-faint">
                Формат работы
              </div>
              <div className="space-y-2">
                {[{ value: "", label: "Любой" }, ...WORK_FORMAT_OPTIONS].map(
                  (opt) => (
                    <label
                      key={opt.value || "any-work"}
                      className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/90"
                    >
                      <input
                        type="radio"
                        name="work"
                        value={opt.value}
                        defaultChecked={(activeWork ?? "") === opt.value}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      {opt.label}
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Занятость */}
            <div>
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-faint">
                Занятость
              </div>
              <div className="space-y-2">
                {[{ value: "", label: "Любая" }, ...EMPLOYMENT_OPTIONS].map(
                  (opt) => (
                    <label
                      key={opt.value || "any-emp"}
                      className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/90"
                    >
                      <input
                        type="radio"
                        name="employment"
                        value={opt.value}
                        defaultChecked={(activeEmployment ?? "") === opt.value}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      {opt.label}
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Ставка */}
            <div>
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-faint">
                Ставка, ₽
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="pay_from"
                  min={0}
                  defaultValue={payFrom ?? ""}
                  placeholder="от"
                  className="field"
                />
                <span className="text-muted">—</span>
                <input
                  type="number"
                  name="pay_to"
                  min={0}
                  defaultValue={payTo ?? ""}
                  placeholder="до"
                  className="field"
                />
              </div>
            </div>

            {/* Статус */}
            <div>
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-faint">
                Статус
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/90">
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

            <div className="flex gap-2">
              <button type="submit" className="btn-accent flex-1 px-4 py-2 text-sm">
                Найти
              </button>
              <Link
                href="/vacancies"
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:border-accent/60 hover:text-foreground"
              >
                Сбросить
              </Link>
            </div>
          </aside>

          {/* Основная колонка */}
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
                  Вакансии
                  {sectionLabel && (
                    <span className="text-accent-light">
                      {" · "}
                      {sectionLabel}
                      {gameLabel ? ` · ${gameLabel}` : ""}
                    </span>
                  )}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {total > 0
                    ? `${total} ${
                        activeSection ? "в этом разделе" : "открытых"
                      }`
                    : "По заданным условиям вакансий пока нет"}
                </p>
              </div>
              <select name="sort" defaultValue={sort} className="field w-auto">
                <option value="relevant">По релевантности</option>
                <option value="pay_desc">Сначала дороже</option>
                <option value="pay_asc">Сначала дешевле</option>
              </select>
            </div>

            {vacancies.length === 0 ? (
              <div className="panel mt-6 flex flex-col items-center gap-4 p-10">
                <MascotSlot caption="Подходящих вакансий не нашли." />
              </div>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {vacancies.map((v) => {
                  const pay = formatPay(v.payMin, v.payMax, v.payPeriod);
                  const employerName =
                    v.employer.employerProfile?.displayName ?? v.employer.name;
                  const employerType = v.employer.employerProfile?.type;
                  return (
                    <Link
                      key={v.id}
                      href={`/vacancies/${v.id}`}
                      className="panel panel-link flex flex-col overflow-hidden"
                    >
                      {/* Шапка карточки: работодатель + продвижение */}
                      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-2 px-4 py-2.5">
                        <span className="truncate text-xs text-muted">
                          {employerName}
                          {employerType
                            ? ` · ${EMPLOYER_TYPE_LABELS[employerType]}`
                            : ""}
                        </span>
                        {v.isPromoted && (
                          <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-light">
                            Топ
                          </span>
                        )}
                      </div>

                      {/* Тело карточки */}
                      <div className="flex flex-1 flex-col p-4">
                        <h2 className="font-display text-base font-bold leading-snug">
                          {v.title}
                        </h2>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {v.sections.map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] text-accent-light"
                            >
                              {SECTION_LABELS[s] ?? s}
                            </span>
                          ))}
                          {v.games.map((g) => (
                            <span
                              key={g}
                              className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] text-accent-light"
                            >
                              {GAME_LABELS[g] ?? g}
                            </span>
                          ))}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
                            {WORK_FORMAT_LABELS[v.workFormat]}
                          </span>
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
                            {EMPLOYMENT_LABELS[v.employment]}
                          </span>
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
                            {v.city ? v.city : v.remote ? "Удалённо" : "—"}
                            {v.city && v.remote ? " · удалённо" : ""}
                          </span>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                          <span className="num text-sm text-foreground">
                            {pay ?? (
                              <span className="text-muted">Оплата договорная</span>
                            )}
                          </span>
                          <span className="btn-accent shrink-0 px-4 py-1.5 text-sm">
                            Откликнуться
                          </span>
                        </div>
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
          </div>
        </main>
      </form>
    </div>
  );
}
