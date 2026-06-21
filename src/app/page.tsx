import Link from "next/link";
import { auth } from "@/auth";
import PublicHeader from "@/components/PublicHeader";

// Лендинг RENDER. Двухколоночный герой:
//  • слева — заход в каталог монтажёров СРАЗУ, без регистрации;
//  • справа — два пути регистрации (монтажёр / работодатель).
export default async function Home() {
  const session = await auth();
  const authed = !!session?.user?.id;

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader authed={authed} />

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-20">
        {/* Левая колонка — каталог без регистрации */}
        <div>
          <p className="eyebrow">
            YouTube · Мобильный формат · Игры · Моушн · 3D
          </p>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
            Найдите видеомонтажёра под свою нишу.{" "}
            <span className="text-accent-light">
              Или свою следующую работу.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted sm:text-lg">
            Каталог монтажёров с шоурилами — смотрите, как человек режет, и пишите
            напрямую. Только поиск и контакт, без посредничества в оплате.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/editors" className="btn-accent px-6 py-3 text-base">
              Смотреть монтажёров →
            </Link>
            <Link
              href="/vacancies"
              className="rounded-lg border border-border px-6 py-3 text-base text-foreground transition hover:border-accent/60"
            >
              Вакансии
            </Link>
          </div>
          <p className="mt-4 text-sm text-faint">
            Каталог открыт без регистрации — вход нужен только чтобы написать.
          </p>
        </div>

        {/* Правая колонка — два пути регистрации */}
        <div className="grid gap-4">
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
      </main>

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
