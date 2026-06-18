"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { toEmbedUrl } from "@/lib/embed";
import { openConversationWith } from "@/app/messages/actions";
import { updateApplicationStatus } from "@/app/vacancies/actions";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_STYLES,
} from "@/lib/labels";

type PortfolioItem = { id: string; url: string; title: string | null };
type Application = {
  id: string;
  status: string;
  message: string;
  vacancyId: string;
  vacancyTitle: string;
  editor: {
    userId: string;
    name: string;
    headline: string;
    avatarUrl: string | null;
    profileId: string | null;
    portfolio: PortfolioItem[];
  };
};

export default function ApplicationsBoard({
  applications,
}: {
  applications: Application[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(applications);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = openIndex !== null ? items[openIndex] : null;

  async function writeTo(editorUserId: string) {
    setBusy(true);
    const res = await openConversationWith(editorUserId);
    setBusy(false);
    if (res?.id) router.push(`/messages/${res.id}`);
  }

  async function setStatus(appId: string, status: string) {
    setBusy(true);
    await updateApplicationStatus(appId, status);
    setBusy(false);
    setItems((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status } : a))
    );
    router.refresh();
  }

  // Открыть заявку: новую сразу помечаем «просмотрено» (для счётчика в кабинете).
  function openCard(idx: number) {
    setOpenIndex(idx);
    const a = items[idx];
    if (a && a.status === "NEW") setStatus(a.id, "VIEWED");
  }

  if (items.length === 0) {
    return (
      <p className="panel p-8 text-center text-muted">
        Когда монтажёры откликнутся на ваши вакансии, заявки появятся здесь.
      </p>
    );
  }

  return (
    <>
      {/* Список заявок */}
      <div className="space-y-3">
        {items.map((a, idx) => (
          <button
            key={a.id}
            type="button"
            onClick={() => openCard(idx)}
            className="panel flex w-full items-center gap-4 p-5 text-left"
          >
            <Avatar src={a.editor.avatarUrl} name={a.editor.name} size={48} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{a.editor.name}</p>
              <p className="truncate text-sm text-muted">
                на «{a.vacancyTitle}»
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                APPLICATION_STATUS_STYLES[a.status]
              }`}
            >
              {APPLICATION_STATUS_LABELS[a.status]}
            </span>
          </button>
        ))}
      </div>

      {/* Модальное окно просмотра заявки */}
      {selected && openIndex !== null && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenIndex(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="modal-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6">
            {/* Верх: слева аватар+ник+кнопки, справа «Отказать» и закрыть */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <Avatar
                    src={selected.editor.avatarUrl}
                    name={selected.editor.name}
                    size={56}
                  />
                  <div>
                    {selected.editor.profileId ? (
                      <Link
                        href={`/editors/${selected.editor.profileId}`}
                        className="font-display text-xl font-bold hover:text-accent"
                      >
                        {selected.editor.name}
                      </Link>
                    ) : (
                      <p className="font-display text-xl font-bold">
                        {selected.editor.name}
                      </p>
                    )}
                    {selected.editor.headline && (
                      <p className="text-sm text-muted">
                        {selected.editor.headline}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => writeTo(selected.editor.userId)}
                    className="btn-accent px-6 py-2.5 disabled:opacity-50"
                  >
                    Написать
                  </button>
                  {selected.status !== "INVITED" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setStatus(selected.id, "INVITED")}
                      className="rounded-full border border-green-400/40 px-4 py-2.5 text-sm font-medium text-green-300 transition hover:bg-green-500/10 disabled:opacity-50"
                    >
                      Пригласить
                    </button>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {selected.status !== "REJECTED" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStatus(selected.id, "REJECTED")}
                    className="rounded-full border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Отказать
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpenIndex(null)}
                  aria-label="Закрыть"
                  className="rounded-full border border-border px-3 py-2 text-sm text-muted transition hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Текущий статус заявки */}
            <div className="mt-4">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  APPLICATION_STATUS_STYLES[selected.status]
                }`}
              >
                {APPLICATION_STATUS_LABELS[selected.status]}
              </span>
            </div>

            {/* Центр: сообщение монтажёра */}
            <div className="mt-6">
              <span className="eyebrow">
                Сообщение · на «{selected.vacancyTitle}»
              </span>
              <p className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-surface-2 p-4 text-foreground/90">
                {selected.message}
              </p>
            </div>

            {/* Ролики из портфолио */}
            <div className="mt-6">
              <span className="eyebrow">Портфолио</span>
              {selected.editor.portfolio.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Монтажёр пока не добавил ролики.
                </p>
              ) : (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {selected.editor.portfolio.map((p) => {
                    const embed = toEmbedUrl(p.url);
                    return embed ? (
                      <iframe
                        key={p.id}
                        src={embed}
                        title={p.title || "Видео"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="aspect-video w-full overflow-hidden rounded-xl border border-border"
                      />
                    ) : (
                      <a
                        key={p.id}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex aspect-video w-full items-center justify-center break-all rounded-xl border border-border bg-surface-2 p-4 text-sm text-accent hover:underline"
                      >
                        {p.title || p.url}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Низ: листание заявок стрелками */}
            <div className="mt-7 flex items-center justify-center gap-6 border-t border-border pt-5">
              <button
                type="button"
                onClick={() => setOpenIndex((i) => (i! > 0 ? i! - 1 : i))}
                disabled={openIndex === 0}
                aria-label="Предыдущая заявка"
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent/60 disabled:opacity-30"
              >
                ← Назад
              </button>
              <span className="text-sm text-muted">
                {openIndex + 1} из {items.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setOpenIndex((i) => (i! < items.length - 1 ? i! + 1 : i))
                }
                disabled={openIndex === items.length - 1}
                aria-label="Следующая заявка"
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent/60 disabled:opacity-30"
              >
                Вперёд →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
