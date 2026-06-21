import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { auth } from "@/auth";
import VacancyForm from "../VacancyForm";

export default async function NewVacancyPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  // Размещать вакансии могут только работодатели.
  if (session.user.role !== "EMPLOYER") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo href="/dashboard" />
        <Link
          href="/dashboard"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← В кабинет
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <span className="eyebrow">Новая вакансия</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
          Разместить вакансию
        </h1>
        <p className="mt-3 text-muted">
          Опишите задачу — монтажёры увидят её в каталоге и откликнутся.
        </p>

        <div className="panel mt-8 p-7">
          <VacancyForm
            initial={{
              title: "",
              description: "",
              workFormat: "PROJECT",
              employment: "PROJECT_BASED",
              formats: [],
              software: [],
              skills: [],
              payMin: null,
              payMax: null,
              payPeriod: "",
              city: "",
              remote: true,
            }}
          />
        </div>
      </main>
    </div>
  );
}
