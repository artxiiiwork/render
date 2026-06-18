"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBio } from "./actions";

// Блок «О себе»: длинный текст сворачивается. Владельцу — кнопка-карандаш
// для редактирования прямо на странице профиля.
export default function ProfileBio({
  text,
  isOwner,
}: {
  text: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false); // развёрнут ли длинный текст
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const long = text.length > 240;

  async function save() {
    setBusy(true);
    setError("");
    const res = await updateBio(draft);
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          О себе
        </span>
        {isOwner && (
          <button
            type="button"
            onClick={() => {
              setDraft(text);
              setError("");
              setEditing(true);
            }}
            aria-label="Изменить описание"
            className="text-sm text-muted transition hover:text-accent"
          >
            ✎
          </button>
        )}
      </div>

      {text ? (
        <>
          <p
            className={`mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 ${
              long && !open ? "line-clamp-6" : ""
            }`}
          >
            {text}
          </p>
          {long && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="mt-1.5 text-xs font-medium text-accent hover:underline"
            >
              {open ? "Свернуть" : "Показать полностью"}
            </button>
          )}
        </>
      ) : (
        isOwner && (
          <p className="mt-1.5 text-sm text-muted/70">
            Расскажите о себе — нажмите карандаш.
          </p>
        )
      )}

      {editing && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setEditing(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="modal-card w-full max-w-lg p-6">
            <h2 className="font-display text-xl font-bold">О себе</h2>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              autoFocus
              placeholder="Опыт, стиль монтажа, любимые проекты"
              className="field mt-4"
            />
            {error && (
              <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="btn-accent px-6 py-2.5 disabled:opacity-50"
              >
                {busy ? "Сохраняем…" : "Сохранить"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={busy}
                className="rounded-full border border-border px-6 py-2.5 font-medium text-muted transition hover:border-accent/60 hover:text-foreground disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
