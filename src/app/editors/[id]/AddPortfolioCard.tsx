"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPortfolioLink } from "./actions";

// Пустая карточка с плюсом рядом с роликами — видна только владельцу резюме.
// По клику открывается окно: ссылка на ролик + описание.
export default function AddPortfolioCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function close() {
    if (loading) return;
    setOpen(false);
    setError("");
  }

  async function submit() {
    setError("");
    setLoading(true);
    const res = await addPortfolioLink({ url, title });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setUrl("");
    setTitle("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-2 text-muted transition hover:border-accent/60 hover:text-accent"
      >
        <span className="text-5xl leading-none font-light">+</span>
        <span className="text-sm font-medium">Добавить ролик</span>
      </button>

      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="modal-card w-full max-w-lg p-6">
            <h2 className="font-display text-xl font-bold">Новый ролик</h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-muted">
                  Ссылка на ролик{" "}
                  <span className="text-muted/60">(YouTube / Vimeo)</span>
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="field"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">
                  Описание <span className="text-muted/60">(необязательно)</span>
                </label>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  rows={3}
                  placeholder="Коротко о ролике: что монтировал, стиль, роль"
                  className="field"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="btn-accent px-6 py-2.5 disabled:opacity-50"
              >
                {loading ? "Добавляем…" : "Добавить"}
              </button>
              <button
                type="button"
                onClick={close}
                disabled={loading}
                className="rounded-full border border-border px-6 py-2.5 font-medium text-muted transition hover:border-accent/60 hover:text-foreground disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
