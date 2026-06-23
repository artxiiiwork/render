import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";
import Logo from "@/components/Logo";
import Pagination from "@/components/Pagination";
import MascotSlot from "@/components/MascotSlot";
import { toThumbUrl } from "@/lib/embed";
import { formatPay } from "@/lib/labels";
import { editorQualityScore, isTopEditor } from "@/lib/ranking";
import {
  SECTION_OPTIONS,
  SECTION_LABELS,
  SECTION_VALUES,
  GAME_OPTIONS,
  GAME_LABELS,
  GAME_VALUES,
  GAMES_SECTION,
  SOFTWARE_OPTIONS,
} from "@/lib/taxonomy";

const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Каталог монтажёров",
  description:
    "Каталог видеомонтажёров с шоурилами: игры (SAMP, CS2), мобильный формат, YouTube, моушн, 3D. Фильтры по нише, софту, ставке и доступности.",
  alternates: { canonical: "/editors" },
};

// Приводим параметр к массиву (для чекбоксов с одинаковым name).
function asArray(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v;
  return v ? [v] : [];
}

export default async function EditorsCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
    game?: string;
    q?: string;
    software?: string | string[];
    pay_from?: string;
    pay_to?: string;
    open?: string;
    staff?: string;
    remote?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  // Каталог публичный — виден и без входа.
  const session = await auth();
  const authed = !!session?.user?.id;

  const sp = await searchParams;
  const activeSection =
    sp.section && SECTION_VALUES.includes(sp.section) ? sp.section : undefined;
  const activeGame =
    activeSection === GAMES_SECTION && sp.game && GAME_VALUES.includes(sp.game)
      ? sp.game
      : undefined;
  const q = sp.q?.trim() || undefined;
  const software = asArray(sp.software).filter((s) =>
    (SOFTWARE_OPTIONS as readonly string[]).includes(s)
  );
  const payFrom = sp.pay_from ? Number(sp.pay_from) : undefined;
  const payTo = sp.pay_to ? Number(sp.pay_to) : undefined;
  const onlyOpen = sp.open === "1";
  const onlyStaff = sp.staff === "1";
  const onlyRemote = sp.remote === "1";
  const sort = sp.sort || "relevant";
  const page = Math.max(1, Number(sp.page) || 1);

  // Условия фильтра.
  const where: Prisma.EditorProfileWhereInput = {};
  if (activeSection) where.sections = { has: activeSection };
  if (activeGame) where.games = { has: activeGame };
  if (software.length) where.software = { hasSome: software };
  if (onlyOpen) where.status = { in: ["SEEKING", "OPEN"] };
  if (onlyStaff) where.workFormats = { has: "STAFF" };
  if (onlyRemote) where.remote = true;
  if (payFrom != null || payTo != null) {
    where.payMin = {};
    if (payFrom != null) where.payMin.gte = payFrom;
    if (payTo != null) where.payMin.lte = payTo;
  }
  if (q) {
    where.OR = [
      { headline: { contains: q, mode: "insensitive" } },
      { bio: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  // Сортировка «По релевантности» считает качество профиля в коде, поэтому
  // тянем подходящие резюме разом (с запасом) и ранжируем в памяти. Для MVP
  // объёмов этого достаточно; при росте базы перейдём на хранимый балл.
  const matched = await prisma.editorProfile.findMany({
    where,
    include: {
      user: { select: { name: true } },
      portfolio: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        take: 1,
        select: { url: true },
      },
      _count: { select: { portfolio: true } },
    },
    take: 500,
  });

  // Балл качества и признак «ТОП» для каждого резюме.
  const ranked = matched.map((e) => {
    const score = editorQualityScore({
      headline: e.headline,
      bio: e.bio,
      avatarUrl: e.avatarUrl,
      coverUrl: e.coverUrl,
      skills: e.skills,
      software: e.software,
      sections: e.sections,
      payMin: e.payMin,
      experienceYears: e.experienceYears,
      status: e.status,
      updatedAt: e.updatedAt,
      reelCount: e._count.portfolio,
    });
    return { ...e, _score: score, _isTop: isTopEditor(score) };
  });

  // Сортировка: по ставке (если выбрано) или по качеству профиля.
  ranked.sort((a, b) => {
    if (sort === "pay_desc" || sort === "pay_asc") {
      const av = a.payMin;
      const bv = b.payMin;
      // null-ставки — всегда в конце.
      if (av == null && bv == null) return b._score - a._score;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sort === "pay_desc" ? bv - av : av - bv;
    }
    // По релевантности: выше балл, при равенстве — свежее.
    if (b._score !== a._score) return b._score - a._score;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const total = ranked.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const editors = ranked.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Подписи активного раздела/игры для заголовка.
  const sectionLabel = activeSection ? SECTION_LABELS[activeSection] : null;
  const gameLabel = activeGame ? GAME_LABELS[activeGame] : null;

  // Параметры для пагинации (сохраняем фильтры при листании).
  const extraParams = {
    section: activeSection,
    game: activeGame,
    q,
    software,
    pay_from: payFrom != null ? String(payFrom) : undefined,
    pay_to: payTo != null ? String(payTo) : undefined,
    open: onlyOpen ? "1" : undefined,
    staff: onlyStaff ? "1" : undefined,
    remote: onlyRemote ? "1" : undefined,
    sort: sort !== "relevant" ? sort : undefined,
  };

  // Стиль чипа раздела в верхней ленте.
  const sectionTabBase =
    "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition";

  return (
    <div className="flex min-h-full flex-col">
      <form method="get" action="/editors">
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
                placeholder="Монтажёр, навык, игра…"
                className="field"
              />
            </div>
            <div className="flex rounded-xl border border-border p-0.5">
              <span className="rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-on-accent">
                Ищу монтажёра
              </span>
              <Link
                href="/vacancies"
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-muted transition hover:text-foreground"
              >
                Я монтажёр
              </Link>
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
              href="/editors"
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
                href={`/editors?section=${s.value}`}
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
                href="/editors?section=GAMES"
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
                  href={`/editors?section=GAMES&game=${g.value}`}
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
            {/* Софт */}
            <div>
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-faint">
                Софт
              </div>
              <div className="space-y-2">
                {SOFTWARE_OPTIONS.map((sw) => (
                  <label
                    key={sw}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/90"
                  >
                    <input
                      type="checkbox"
                      name="software"
                      value={sw}
                      defaultChecked={software.includes(sw)}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    {sw}
                  </label>
                ))}
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
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/90">
                  <input
                    type="checkbox"
                    name="open"
                    value="1"
                    defaultChecked={onlyOpen}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  Открыт к работе
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/90">
                  <input
                    type="checkbox"
                    name="staff"
                    value="1"
                    defaultChecked={onlyStaff}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  Можно в штат
                </label>
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
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-accent flex-1 px-4 py-2 text-sm">
                Найти
              </button>
              <Link
                href="/editors"
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
                  Монтажёры
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
                        activeSection ? "в этом разделе" : "в каталоге"
                      }`
                    : "По заданным условиям пока никого нет"}
                </p>
              </div>
              <select
                name="sort"
                defaultValue={sort}
                className="field w-auto"
              >
                <option value="relevant">По релевантности</option>
                <option value="pay_desc">Сначала дороже</option>
                <option value="pay_asc">Сначала дешевле</option>
              </select>
            </div>

            {editors.length === 0 ? (
              <div className="panel mt-6 flex flex-col items-center gap-4 p-10">
                <MascotSlot caption="Никого не нашли. Попробуйте смягчить фильтры." />
              </div>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {editors.map((e) => {
                  const pay = formatPay(e.payMin, e.payMax, e.payPeriod);
                  const cover = e.portfolio[0]
                    ? toThumbUrl(e.portfolio[0].url)
                    : null;
                  return (
                    <div
                      key={e.id}
                      className="panel panel-link flex flex-col overflow-hidden"
                    >
                      {/* Обложка шоурила */}
                      <Link
                        href={`/editors/${e.id}`}
                        className="group relative block aspect-video overflow-hidden bg-surface-2"
                      >
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt=""
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{
                              backgroundImage:
                                "linear-gradient(150deg, #3a1191, #1c0e3e)",
                            }}
                          />
                        )}
                        {e._isTop && (
                          <span className="absolute left-2.5 top-2.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-accent shadow-lg">
                            ТОП
                          </span>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white transition group-hover:bg-black/60">
                            ▶
                          </span>
                        </span>
                        {/* Декоративная «дорожка» ролика */}
                        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-black/30">
                          <span className="block h-full w-1/3 bg-accent" />
                        </span>
                      </Link>

                      {/* Данные */}
                      <div className="flex flex-1 flex-col p-4">
                        <Link
                          href={`/editors/${e.id}`}
                          className="flex items-center gap-2.5"
                        >
                          <Avatar src={e.avatarUrl} name={e.user.name} size={36} />
                          <div className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate font-display text-base font-bold">
                                {e.user.name}
                              </span>
                              {e.status === "SEEKING" && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-green" />
                              )}
                            </span>
                            <span className="block truncate text-xs text-muted">
                              {e.headline}
                            </span>
                          </div>
                        </Link>

                        {(e.sections.length > 0 || e.games.length > 0) && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {e.sections.map((s) => (
                              <span
                                key={s}
                                className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] text-accent-light"
                              >
                                {SECTION_LABELS[s] ?? s}
                              </span>
                            ))}
                            {e.games.map((g) => (
                              <span
                                key={g}
                                className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] text-accent-light"
                              >
                                {GAME_LABELS[g] ?? g}
                              </span>
                            ))}
                          </div>
                        )}

                        {e.software.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {e.software.slice(0, 4).map((sw) => (
                              <span
                                key={sw}
                                className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted"
                              >
                                {sw}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                          <span className="num text-sm text-foreground">
                            {pay ?? (
                              <span className="text-muted">Ставка не указана</span>
                            )}
                          </span>
                          <Link
                            href={`/editors/${e.id}`}
                            className="btn-accent shrink-0 px-4 py-1.5 text-sm"
                          >
                            Связаться
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Pagination
              basePath="/editors"
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
