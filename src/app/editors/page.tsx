import type { Metadata } from "next";
import Link from "next/link";
import { Prisma, EditorStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";
import PublicHeader from "@/components/PublicHeader";
import Pagination from "@/components/Pagination";
import MascotSlot from "@/components/MascotSlot";
import { toThumbUrl } from "@/lib/embed";
import {
  EDITOR_STATUS_OPTIONS,
  EDITOR_STATUS_LABELS,
  EDITOR_STATUS_STYLES,
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
const STATUS_VALUES = EDITOR_STATUS_OPTIONS.map((o) => o.value) as string[];

export const metadata: Metadata = {
  title: "Каталог монтажёров",
  description:
    "Каталог видеомонтажёров с шоурилами: игры (SAMP, CS2), мобильный формат, YouTube, моушн, 3D. Фильтры по нише, ставке и доступности.",
  alternates: { canonical: "/editors" },
};

export default async function EditorsCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
    game?: string;
    status?: string;
    q?: string;
    remote?: string;
    page?: string;
  }>;
}) {
  // Каталог публичный — виден и без входа. Логин нужен только на действиях.
  const session = await auth();
  const authed = !!session?.user?.id;

  const sp = await searchParams;
  const activeSection =
    sp.section && SECTION_VALUES.includes(sp.section) ? sp.section : undefined;
  // Игра учитывается только в разделе «Игры».
  const activeGame =
    activeSection === GAMES_SECTION && sp.game && GAME_VALUES.includes(sp.game)
      ? sp.game
      : undefined;
  const activeStatus =
    sp.status && STATUS_VALUES.includes(sp.status) ? sp.status : undefined;
  const q = sp.q?.trim() || undefined;
  const onlyRemote = sp.remote === "1";
  const page = Math.max(1, Number(sp.page) || 1);

  // Собираем условия фильтра.
  const where: Prisma.EditorProfileWhereInput = {};
  if (activeSection) where.sections = { has: activeSection };
  if (activeGame) where.games = { has: activeGame };
  if (activeStatus) where.status = activeStatus as EditorStatus;
  if (onlyRemote) where.remote = true;
  if (q) {
    where.OR = [
      { headline: { contains: q, mode: "insensitive" } },
      { bio: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const total = await prisma.editorProfile.count({ where });
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const editors = await prisma.editorProfile.findMany({
    where,
    include: {
      user: { select: { name: true } },
      // Первый ролик — для обложки-превью на карточке.
      portfolio: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        take: 1,
        select: { url: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  // Параметры для пагинации (чтобы фильтры сохранялись при листании).
  const extraParams = {
    section: activeSection,
    game: activeGame,
    status: activeStatus,
    q,
    remote: onlyRemote ? "1" : undefined,
  };

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader authed={authed} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <span className="eyebrow">Каталог</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
          Монтажёры
        </h1>
        <p className="mt-3 text-muted">
          {total > 0
            ? `Найдено: ${total}`
            : "По заданным условиям пока никого нет"}
        </p>

        {/* Фильтры — обычная форма, работает через адрес страницы. */}
        <form method="get" action="/editors" className="panel mt-6 space-y-4 p-5">
          {/* Разделы (ниши) */}
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

          {/* Подфильтр «игра» — только когда выбран раздел «Игры». */}
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

          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Поиск: имя, специализация, описание"
              className="field"
            />
            <select name="status" defaultValue={activeStatus ?? ""} className="field">
              <option value="">Любая доступность</option>
              {EDITOR_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-foreground/90">
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

          <div className="flex gap-3">
            <button type="submit" className="btn-accent px-5 py-2 text-sm">
              Найти
            </button>
            <Link
              href="/editors"
              className="rounded-lg border border-border px-5 py-2 text-sm text-muted transition hover:border-accent/60 hover:text-foreground"
            >
              Сбросить
            </Link>
          </div>
        </form>

        {/* Карточки монтажёров. */}
        {editors.length === 0 ? (
          <div className="panel mt-6 flex flex-col items-center gap-4 p-10">
            <MascotSlot caption="Никого не нашли. Попробуйте смягчить фильтры." />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {editors.map((e) => {
              const pay = formatPay(e.payMin, e.payMax, e.payPeriod);
              const cover = e.portfolio[0]
                ? toThumbUrl(e.portfolio[0].url)
                : null;
              return (
                <Link
                  key={e.id}
                  href={`/editors/${e.id}`}
                  className="panel panel-link group flex flex-col overflow-hidden"
                >
                  {/* Обложка шоурила — главное на карточке */}
                  <div className="relative aspect-video w-full overflow-hidden bg-surface-2">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{
                          backgroundImage:
                            "linear-gradient(150deg, #3a1191, #1c0e3e)",
                        }}
                      >
                        <span className="text-2xl text-white/35">▶</span>
                      </div>
                    )}
                    {cover && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
                          ▶
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Данные */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={e.avatarUrl} name={e.user.name} size={36} />
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-display text-base font-bold">
                          {e.user.name}
                        </h2>
                        <p className="truncate text-xs text-muted">
                          {e.headline}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          EDITOR_STATUS_STYLES[e.status]
                        }`}
                      >
                        {EDITOR_STATUS_LABELS[e.status]}
                      </span>
                    </div>

                    {e.sections.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {e.sections.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] text-accent-light"
                          >
                            {SECTION_LABELS[s] ?? s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted">
                        {e.city ? e.city : e.remote ? "Удалённо" : "—"}
                        {e.city && e.remote ? " · удалённо" : ""}
                      </span>
                      {pay && (
                        <span className="num font-medium text-foreground">
                          {pay}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
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
      </main>
    </div>
  );
}
