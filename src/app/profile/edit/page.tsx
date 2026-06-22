import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import EditEditorForm from "./EditEditorForm";
import EditEmployerForm from "./EditEmployerForm";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      editorProfile: { include: { portfolio: true } },
      employerProfile: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const isEditor = user.role === "EDITOR";

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
        <span className="eyebrow">
          {isEditor ? "Резюме монтажёра" : "Профиль работодателя"}
        </span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
          {isEditor ? "Заполните резюме" : "Заполните профиль"}
        </h1>
        <p className="mt-3 text-muted">
          {isEditor
            ? "Чем подробнее резюме, тем выше шанс, что вас найдут работодатели."
            : "Расскажите о себе — это видят монтажёры, которым вы пишете."}
        </p>

        <div className="panel mt-8 p-7">
          {isEditor ? (
            <EditEditorForm
              initial={{
                headline: user.editorProfile?.headline ?? "",
                bio: user.editorProfile?.bio ?? "",
                avatarUrl: user.editorProfile?.avatarUrl ?? "",
                coverUrl: user.editorProfile?.coverUrl ?? "",
                skills: user.editorProfile?.skills ?? [],
                software: user.editorProfile?.software ?? [],
                sections: user.editorProfile?.sections ?? [],
                games: user.editorProfile?.games ?? [],
                languages: user.editorProfile?.languages ?? [],
                experienceYears: user.editorProfile?.experienceYears ?? null,
                workFormats: user.editorProfile?.workFormats ?? [],
                payMin: user.editorProfile?.payMin ?? null,
                payMax: user.editorProfile?.payMax ?? null,
                payPeriod: user.editorProfile?.payPeriod ?? "",
                city: user.editorProfile?.city ?? "",
                remote: user.editorProfile?.remote ?? true,
                status: user.editorProfile?.status ?? "SEEKING",
                portfolio:
                  user.editorProfile?.portfolio.map((p) => ({
                    url: p.url,
                    title: p.title ?? "",
                  })) ?? [],
              }}
            />
          ) : (
            <EditEmployerForm
              initial={{
                displayName: user.employerProfile?.displayName ?? user.name,
                type: user.employerProfile?.type ?? "BLOGGER",
                description: user.employerProfile?.description ?? "",
                channelUrl: user.employerProfile?.channelUrl ?? "",
                logoUrl: user.employerProfile?.logoUrl ?? "",
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
