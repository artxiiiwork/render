import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Logo from "@/components/Logo";
import RoleChoice from "./RoleChoice";

export const metadata: Metadata = {
  title: "Выбор роли",
  robots: { index: false, follow: false },
};

// Экран после первого входа через соцсеть: человек выбирает роль.
export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // Роль уже выбрана — на этом экране делать нечего.
  if (session.user.role) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 py-5 sm:px-10">
        <Logo href="/" size={32} />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 pb-16">
        <span className="eyebrow">Почти готово</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
          Кто вы на RENDER?
        </h1>
        <p className="mt-2 text-muted">
          Осталось выбрать роль — от неё зависит, что вы будете делать на площадке.
        </p>

        <RoleChoice />
      </main>
    </div>
  );
}
