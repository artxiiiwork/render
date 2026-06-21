"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { messageUser } from "@/app/messages/actions";

// Кнопка «Связаться»: открывает окно первого сообщения, после отправки
// создаётся диалог и пользователь переходит в чат с этим собеседником.
export default function ContactButton({
  userId,
  name,
  authed,
}: {
  userId: string;
  name: string;
  authed: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    setError("");
    setBusy(true);
    const res = await messageUser(userId, text);
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    if (res?.id) router.push(`/messages/${res.id}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          // Гостю — на вход (анти-обход: контакт только после логина).
          if (!authed) {
            router.push("/login");
            return;
          }
          setOpen(true);
        }}
        className="btn-accent flex w-full justify-center px-6 py-3"
      >
        Связаться
      </button>

      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="modal-card w-full max-w-lg p-6">
            <h2 className="font-display text-xl font-bold">Написать: {name}</h2>
            <p className="mt-1 text-sm text-muted">
              Представьтесь и коротко расскажите, что нужно. После отправки
              откроется чат.
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              autoFocus
              placeholder="Здравствуйте! Ищу монтажёра для…"
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
                onClick={send}
                disabled={busy}
                className="btn-accent px-6 py-2.5 disabled:opacity-50"
              >
                {busy ? "Отправляем…" : "Отправить"}
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
