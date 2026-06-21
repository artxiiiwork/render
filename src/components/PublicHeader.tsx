import Link from "next/link";
import Logo from "@/components/Logo";

// Шапка публичных страниц (каталог, профиль, вакансии). Видна и гостю, и
// вошедшему. Для гостя — «Войти / Регистрация», для вошедшего — «В кабинет».
export default function PublicHeader({ authed }: { authed: boolean }) {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 sm:px-10">
      <div className="flex items-center gap-6">
        <Logo href="/" />
        <nav className="hidden items-center gap-5 text-sm sm:flex">
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
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {authed ? (
          <Link
            href="/dashboard"
            className="rounded-lg border border-border px-4 py-2 text-foreground transition hover:border-accent/60"
          >
            В кабинет
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="text-foreground/90 transition-colors hover:text-foreground"
            >
              Войти
            </Link>
            <Link href="/register" className="btn-accent px-4 py-2">
              Регистрация
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
