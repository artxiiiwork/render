"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEditorProfileAdmin, deleteVacancyAdmin } from "./actions";

// Кнопка удаления в админке: открывает окно с причиной, причина уходит
// пользователю сообщением от «Поддержки RENDER».
export default function AdminDeleteButton({
  id,
  kind,
  label,
}: {
  id: string;
  kind: "editor" | "vacancy";
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setError("");
    setBusy(true);
    const res =
      kind === "editor"
        ? await deleteEditorProfileAdmin(id, reason)
        : await deleteVacancyAdmin(id, reason);
    setBusy(false);
    if (res?.ok) {
      setOpen(false);
      setReason("");
      router.refresh();
    } else {
      setError(res?.error ?? "Не удалось удалить");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
      >
        Удалить
      </button>

      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="modal-card w-full max-w-lg p-6">
            <h2 className="font-display text-xl font-bold">Удаление</h2>
            <p className="mt-1 text-sm text-muted">{label}</p>
            <p className="mt-3 text-sm text-foreground/80">
              Укажите причину — она уйдёт пользователю сообщением от «Поддержки
              RENDER».
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              autoFocus
              placeholder="Например: в резюме указаны чужие работы / спам в описании"
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
                onClick={confirm}
                disabled={busy}
                className="rounded-full border border-red-500/50 bg-red-500/10 px-6 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {busy ? "Удаляем…" : "Удалить и уведомить"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
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
