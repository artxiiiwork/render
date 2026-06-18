"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"EDITOR" | "EMPLOYER">("EDITOR");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Предвыбор роли по ссылке с лендинга (?role=editor / ?role=employer).
  // Читаем адрес только после монтирования: так и сервер, и первый клиентский
  // рендер дают одинаковое значение (EDITOR), а роль подставляется уже потом —
  // это убирает рассинхрон при гидрации. Эффект здесь именно для этого.
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("role");
    if (r !== "employer" && r !== "editor") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRole(r === "employer" ? "EMPLOYER" : "EDITOR");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Создаём пользователя через нашу "приёмную".
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Не удалось зарегистрироваться");
        setLoading(false);
        return;
      }

      // 2. Сразу входим под только что созданным пользователем.
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError(
          "Регистрация прошла, но войти не удалось. Попробуйте на странице входа."
        );
        setLoading(false);
        return;
      }

      // 3. Ведём в личный кабинет.
      router.push("/dashboard");
    } catch {
      setError("Что-то пошло не так. Попробуйте ещё раз.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="panel w-full max-w-md p-8">
        <Link
          href="/"
          className="font-display text-xl font-black tracking-[0.15em] text-accent"
        >
          RENDER
        </Link>
        <h1 className="mt-5 font-display text-3xl font-extrabold">Регистрация</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-muted">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-muted">
              Пароль <span className="text-muted/60">(минимум 6 символов)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="field"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">
              Я регистрируюсь как:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("EDITOR")}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  role === "EDITOR"
                    ? "border-accent bg-accent text-on-accent"
                    : "border-border text-foreground hover:border-accent/60"
                }`}
              >
                Монтажёр
                <span className="block text-xs font-normal opacity-80">
                  ищу работу
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("EMPLOYER")}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  role === "EMPLOYER"
                    ? "border-accent bg-accent text-on-accent"
                    : "border-border text-foreground hover:border-accent/60"
                }`}
              >
                Работодатель
                <span className="block text-xs font-normal opacity-80">
                  ищу монтажёра
                </span>
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full px-4 py-2.5 disabled:opacity-50"
          >
            {loading ? "Создаём аккаунт…" : "Зарегистрироваться"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
