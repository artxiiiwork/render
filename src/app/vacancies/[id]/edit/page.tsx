import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import VacancyForm from "../../VacancyForm";

export default async function EditVacancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const vacancy = await prisma.vacancy.findUnique({ where: { id } });
  if (!vacancy) {
    notFound();
  }
  // Редактировать может только владелец вакансии.
  if (vacancy.employerId !== session.user.id) {
    redirect(`/vacancies/${id}`);
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href="/dashboard"
          className="font-display text-2xl font-black tracking-[0.15em] text-accent"
        >
          RENDER
        </Link>
        <Link
          href={`/vacancies/${id}`}
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← К вакансии
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <span className="eyebrow">Редактирование</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
          Вакансия
        </h1>

        <div className="panel mt-8 p-7">
          <VacancyForm
            vacancyId={vacancy.id}
            initial={{
              title: vacancy.title,
              description: vacancy.description,
              workFormat: vacancy.workFormat,
              employment: vacancy.employment,
              formats: vacancy.formats,
              software: vacancy.software,
              skills: vacancy.skills,
              payMin: vacancy.payMin,
              payMax: vacancy.payMax,
              payPeriod: vacancy.payPeriod ?? "",
              city: vacancy.city ?? "",
              remote: vacancy.remote,
            }}
          />
        </div>
      </main>
    </div>
  );
}
