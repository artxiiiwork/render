import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toEmbedUrl } from "@/lib/embed";
import Avatar from "@/components/Avatar";
import ContactButton from "./ContactButton";
import ProfileBio from "./ProfileBio";
import ResumeDetails from "./ResumeDetails";
import PortfolioGallery from "./PortfolioGallery";
import {
  FORMAT_LABELS,
  WORK_FORMAT_LABELS,
  EDITOR_STATUS_LABELS,
  EDITOR_STATUS_STYLES,
  formatPay,
} from "@/lib/labels";

export default async function EditorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const editor = await prisma.editorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      portfolio: { orderBy: [{ position: "asc" }, { id: "asc" }] },
    },
  });

  if (!editor) {
    notFound();
  }

  // Это резюме открыл его владелец? Тогда покажем кнопку добавления роликов.
  const isOwner = editor.userId === session.user.id;

  const pay = formatPay(editor.payMin, editor.payMax, editor.payPeriod);
  const formatLabels = editor.formats.map((f) => FORMAT_LABELS[f] ?? f);
  const workLabels = editor.workFormats.map((w) => WORK_FORMAT_LABELS[w] ?? w);
  const where = editor.city
    ? editor.remote
      ? `${editor.city} · удалённо`
      : editor.city
    : editor.remote
      ? "Удалённо"
      : null;

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo href="/dashboard" />
        <Link
          href="/editors"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← К каталогу
        </Link>
      </header>

      {/* Обложка-шапка во всю ширину экрана */}
      <div className="relative w-full">
        {editor.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={editor.coverUrl}
            alt=""
            className="h-52 w-full object-cover sm:h-64 lg:h-80"
          />
        ) : (
          <div className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-[#1c1c46] via-[#131333] to-[#0d0d27] sm:h-64 lg:h-80">
            <span className="font-display text-6xl font-black tracking-[0.2em] text-accent/15">
              RENDER
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      <main className="relative z-10 w-full flex-1 px-6 pb-16 sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[20rem_1fr] lg:gap-12">
          {/* Левая колонка — основная информация */}
          <aside>
            <div className="-mt-16 w-fit rounded-full bg-background p-1.5 shadow-xl">
              <Avatar
                src={editor.avatarUrl}
                name={editor.user.name}
                size={128}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-extrabold">
                {editor.user.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  EDITOR_STATUS_STYLES[editor.status]
                }`}
              >
                {EDITOR_STATUS_LABELS[editor.status]}
              </span>
            </div>
            <p className="mt-1 text-lg text-muted">{editor.headline}</p>

            <div className="mt-5">
              {isOwner ? (
                <Link
                  href="/profile/edit"
                  className="flex w-full justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:border-accent/60 hover:text-accent"
                >
                  Редактировать резюме
                </Link>
              ) : (
                <ContactButton userId={editor.userId} name={editor.user.name} />
              )}
            </div>

            {/* О себе + кнопка «Подробнее» (вся остальная инфо — в модальном окне) */}
            <div className="mt-7 space-y-5 border-t border-border pt-6">
              {(editor.bio || isOwner) && (
                <ProfileBio text={editor.bio ?? ""} isOwner={isOwner} />
              )}

              <ResumeDetails
                name={editor.user.name}
                headline={editor.headline}
                formats={formatLabels}
                software={editor.software}
                skills={editor.skills}
                workFormats={workLabels}
                languages={editor.languages}
                experienceYears={editor.experienceYears}
                where={where}
                pay={pay}
              />
            </div>
          </aside>

          {/* Правая колонка — галерея работ */}
          <section className="lg:pt-6">
            <span className="eyebrow">Шоурил и портфолио</span>
            <PortfolioGallery
              isOwner={isOwner}
              items={editor.portfolio.map((p) => ({
                id: p.id,
                url: p.url,
                title: p.title,
                embed: toEmbedUrl(p.url),
              }))}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
