import Link from "next/link";
import Logo from "@/components/Logo";

// Лендинг RENDER — первая страница.
// Сдержанный герой + два входа-плашки (монтажёр / работодатель), видны без прокрутки.
export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Шапка */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo href="/" />
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/editors"
            className="text-muted transition-colors hover:text-foreground"
          >
            Монтажёры
          </Link>
          <Link
            href="/vacancies"
            className="text-muted transition-colors hover:text-foreground"
          >
            Вакансии
          </Link>
          <Link
            href="/login"
            className="text-foreground/90 transition-colors hover:text-foreground"
          >
            Войти
          </Link>
          <Link href="/register" className="btn-accent px-4 py-2 text-sm">
            Регистрация
          </Link>
        </nav>
      </header>

      {/* Главный экран */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-12 text-center sm:py-16">
        <p className="eyebrow">Для YouTube · Shorts · Reels · TikTok</p>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
          Найдите своего видеомонтажёра.{" "}
          <span className="text-accent">Или свою следующую работу.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
          Площадка, где блогеры, студии и агентства находят монтажёров, а
          монтажёры — работу. Только поиск и контакт, без посредничества в оплате.
        </p>

        {/* Два входа */}
        <div className="mt-12 grid w-full gap-5 sm:grid-cols-2">
          <Link
            href="/register?role=editor"
            className="panel flex flex-col p-7 text-left"
          >
            <span className="eyebrow">Соискателю</span>
            <h2 className="mt-3 font-display text-2xl font-extrabold">
              Я монтажёр
            </h2>
            <p className="mt-2 flex-1 text-muted">
              Резюме с шоурилом и отклики на вакансии. Бесплатно.
            </p>
            <span className="btn-accent mt-6 self-start px-5 py-2.5 text-sm">
              Создать резюме →
            </span>
          </Link>

          <Link
            href="/register?role=employer"
            className="panel flex flex-col p-7 text-left"
          >
            <span className="eyebrow">Работодателю</span>
            <h2 className="mt-3 font-display text-2xl font-extrabold">
              Мне нужен монтажёр
            </h2>
            <p className="mt-2 flex-1 text-muted">
              Вакансия и каталог монтажёров по софту, формату и опыту.
            </p>
            <span className="btn-accent mt-6 self-start px-5 py-2.5 text-sm">
              Разместить вакансию →
            </span>
          </Link>
        </div>
      </main>

      {/* Подвал */}
      <footer className="px-6 py-6 text-center text-sm text-muted/70">
        <p>
          RENDER — поиск и контакт между монтажёрами и работодателями. Оплату
          между сторонами площадка не проводит.
        </p>
        <p className="mt-2">
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Политика обработки персональных данных
          </Link>
        </p>
      </footer>
    </div>
  );
}
