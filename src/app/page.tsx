import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PublicHeader from "@/components/PublicHeader";
import Avatar from "@/components/Avatar";
import { toThumbUrl } from "@/lib/embed";
import { formatPay } from "@/lib/labels";
import { SECTION_OPTIONS, SECTION_LABELS } from "@/lib/taxonomy";

// Небольшая «статистика» под героем.
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-lg font-black text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-faint">
        {label}
      </div>
    </div>
  );
}

const PLACEHOLDER_BGS = [
  "linear-gradient(150deg, #6d28d9, #241047)",
  "linear-gradient(150deg, #a855f7, #3a1191)",
  "linear-gradient(150deg, #7c3aed, #1c0e3e)",
];

// Лендинг RENDER. Тёмная «студийная» сцена: свет даёт сам шоурил.
//  • слева — заголовок + заход в каталог без регистрации;
//  • справа — стена шоурилов: реальные монтажёры с роликами (если их ещё нет —
//    аккуратные заглушки);
//  • ниже — ниши и два пути регистрации.
export default async function Home() {
  const session = await auth();
  const authed = !!session?.user?.id;

  // Несколько монтажёров с роликами — для стены шоурилов.
  const featured = await prisma.editorProfile.findMany({
    where: { portfolio: { some: {} } },
    include: {
      user: { select: { name: true } },
      portfolio: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        take: 1,
        select: { url: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 4,
  });

  const big = featured[0] ?? null;
  const bigCover = big?.portfolio[0] ? toThumbUrl(big.portfolio[0].url) : null;
  const bigSection = big?.sections[0] ? SECTION_LABELS[big.sections[0]] : null;
  const bigPay = big ? formatPay(big.payMin, big.payMax, big.payPeriod) : null;
  const smalls = featured.slice(1, 4);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader authed={authed} />

      {/* Герой */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(90% 70% at 88% -5%, rgba(124,58,237,0.28), transparent 60%)",
        }}
      >
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:py-16">
          {/* Левая колонка */}
          <div>
            <p className="eyebrow">◆ Ниша-доска для видеомонтажёров</p>
            <h1 className="mt-4 font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
              Найдите своего видеомонтажёра.{" "}
              <span className="text-accent-light">
                Или свою следующую работу.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted">
              Видно, как человек режет, ещё до первого сообщения. Выбирайте по
              шоурилу и пишите напрямую. Только поиск и контакт, без
              посредничества в оплате.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/editors" className="btn-accent px-6 py-3 text-base">
                Смотреть монтажёров ↗
              </Link>
              <Link
                href="/vacancies"
                className="rounded-lg border border-border px-6 py-3 text-base text-foreground transition hover:border-accent/60"
              >
                Вакансии
              </Link>
            </div>
            <div className="mt-8 flex gap-7 border-t border-border pt-5">
              <Stat value={`${SECTION_OPTIONS.length} ниш`} label="SAMP · CS2 · 3D" />
              <Stat value="0%" label="комиссии" />
              <Stat value="без логина" label="каталог открыт" />
            </div>
          </div>

          {/* Правая колонка — стена шоурилов */}
          <div>
            <Link
              href={big ? `/editors/${big.id}` : "/editors"}
              className="group relative block aspect-[16/10] overflow-hidden rounded-2xl"
              style={{
                backgroundImage: bigCover
                  ? undefined
                  : "linear-gradient(150deg, #8b5cf6, #3a1191 70%)",
                boxShadow: "0 24px 60px -20px rgba(124,58,237,0.5)",
              }}
            >
              {bigCover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bigCover}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/35 text-xl text-white transition group-hover:bg-black/55">
                  ▶
                </span>
              </span>
              {bigSection && (
                <span className="absolute left-3 top-3 rounded-md bg-black/45 px-2 py-1 text-[10px] text-white">
                  {bigSection}
                </span>
              )}
              {big && (
                <span
                  className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-3 pb-3 pt-6"
                  style={{
                    backgroundImage:
                      "linear-gradient(0deg, rgba(8,5,20,0.85), transparent)",
                  }}
                >
                  <Avatar src={big.avatarUrl} name={big.user.name} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-white">
                      {big.user.name}
                    </span>
                    <span className="block truncate text-[10px] text-white/60">
                      {big.headline}
                    </span>
                  </span>
                  {bigPay && (
                    <span className="num shrink-0 text-xs text-white">
                      {bigPay}
                    </span>
                  )}
                </span>
              )}
            </Link>

            <div className="mt-2 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => {
                const ed = smalls[i];
                const cover = ed?.portfolio[0]
                  ? toThumbUrl(ed.portfolio[0].url)
                  : null;
                return (
                  <Link
                    key={i}
                    href={ed ? `/editors/${ed.id}` : "/editors"}
                    className="group relative block aspect-video overflow-hidden rounded-xl"
                    style={{
                      backgroundImage: cover ? undefined : PLACEHOLDER_BGS[i],
                    }}
                  >
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center text-white/85 transition group-hover:text-white">
                      ▶
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Чипы ниш — ведут в каталог с фильтром по разделу */}
        <div className="mx-auto w-full max-w-6xl px-6 pb-9">
          <div className="flex flex-wrap gap-2">
            {SECTION_OPTIONS.map((s) => (
              <Link
                key={s.value}
                href={`/editors?section=${s.value}`}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-accent-light transition hover:border-accent/60"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Как это работает — объясняем механизм контакта */}
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <span className="eyebrow">Как это работает</span>
        <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
          Без посредников и комиссий
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "1",
              title: "Монтажёр публикует резюме",
              text: "Заполняет профиль и добавляет шоурил — видно, как он режет, ещё до первого сообщения.",
            },
            {
              n: "2",
              title: "Работодатель нажимает «Связаться»",
              text: "Смотрит работы в каталоге, выбирает подходящего и пишет ему первое сообщение прямо с профиля.",
            },
            {
              n: "3",
              title: "Открывается переписка на сайте",
              text: "Дальше общаетесь и договариваетесь напрямую во встроенном чате. Уведомления о новых сообщениях приходят и в Telegram.",
            },
          ].map((s) => (
            <div key={s.n} className="panel flex flex-col p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-base font-bold text-on-accent">
                {s.n}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Два пути регистрации */}
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/register?role=editor"
            className="panel panel-link flex flex-col p-6"
          >
            <span className="eyebrow">Соискателю</span>
            <h2 className="mt-3 font-display text-xl font-bold">Я монтажёр</h2>
            <p className="mt-1.5 text-sm text-muted">
              Создать резюме с шоурилом и откликаться на вакансии. Бесплатно.
            </p>
            <span className="mt-4 text-sm font-medium text-accent-light">
              Создать резюме →
            </span>
          </Link>

          <Link
            href="/register?role=employer"
            className="panel panel-link flex flex-col p-6"
          >
            <span className="eyebrow">Работодателю</span>
            <h2 className="mt-3 font-display text-xl font-bold">
              Я работодатель
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Разместить вакансию и искать монтажёров в каталоге по нише.
            </p>
            <span className="mt-4 text-sm font-medium text-accent-light">
              Разместить вакансию →
            </span>
          </Link>
        </div>
      </section>

      <footer className="px-6 py-6 text-center text-sm text-faint">
        <p>
          RENDER — поиск и контакт между монтажёрами и работодателями. Оплату
          между сторонами площадка не проводит.
        </p>
        <p className="mt-2">
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Политика обработки персональных данных
          </Link>
        </p>
      </footer>
    </div>
  );
}
