import Link from "next/link";
import { auth } from "@/auth";
import PublicHeader from "@/components/PublicHeader";

// Ниши верхнего уровня (под будущую таксономию). Пока ведут в общий каталог.
const NICHES = [
  "Игры",
  "Мобильный формат",
  "YouTube",
  "Моушн",
  "3D / CGI",
];

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

// Лендинг RENDER. Тёмная «студийная» сцена: свет даёт сам шоурил.
//  • слева — заголовок + заход в каталог без регистрации;
//  • справа — стена шоурилов (пока стилизованные заглушки — наполнятся
//    реальными превью, когда появятся монтажёры);
//  • ниже — ниши и два пути регистрации.
export default async function Home() {
  const session = await auth();
  const authed = !!session?.user?.id;

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
              <Stat value="12 ниш" label="SAMP · CS2 · 3D" />
              <Stat value="0%" label="комиссии" />
              <Stat value="без логина" label="каталог открыт" />
            </div>
          </div>

          {/* Правая колонка — стена шоурилов */}
          <div>
            <Link
              href="/editors"
              className="group relative block aspect-[16/10] overflow-hidden rounded-2xl"
              style={{
                backgroundImage: "linear-gradient(150deg, #8b5cf6, #3a1191 70%)",
                boxShadow: "0 24px 60px -20px rgba(124,58,237,0.5)",
              }}
            >
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-xl text-white transition group-hover:bg-white/30">
                  ▶
                </span>
              </span>
              <span className="absolute left-3 top-3 rounded-md bg-black/40 px-2 py-1 text-[10px] text-white">
                Игры · SAMP
              </span>
              <span className="num absolute right-3 top-3 rounded-md bg-black/40 px-1.5 py-1 text-[10px] text-white">
                1:08
              </span>
              <span
                className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-3 pb-3 pt-6"
                style={{
                  backgroundImage:
                    "linear-gradient(0deg, rgba(8,5,20,0.85), transparent)",
                }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-xs font-bold text-[#1E1248]">
                  А
                </span>
                <span className="flex-1">
                  <span className="block text-xs font-semibold text-white">
                    Алексей
                  </span>
                  <span className="block text-[10px] text-white/60">
                    Монтажёр игровых нарезок
                  </span>
                </span>
                <span className="num text-xs text-white">50k ₽</span>
              </span>
            </Link>

            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                "linear-gradient(150deg, #6d28d9, #241047)",
                "linear-gradient(150deg, #a855f7, #3a1191)",
                "linear-gradient(150deg, #7c3aed, #1c0e3e)",
              ].map((bg, i) => (
                <Link
                  key={i}
                  href="/editors"
                  className="group relative block aspect-video overflow-hidden rounded-xl"
                  style={{ backgroundImage: bg }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white/85 transition group-hover:text-white">
                    ▶
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Чипы ниш */}
        <div className="mx-auto w-full max-w-6xl px-6 pb-9">
          <div className="flex flex-wrap gap-2">
            {NICHES.map((n) => (
              <Link
                key={n}
                href="/editors"
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-accent-light transition hover:border-accent/60"
              >
                {n}
              </Link>
            ))}
          </div>
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
