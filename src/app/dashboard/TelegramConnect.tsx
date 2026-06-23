"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTelegramLink, disconnectTelegram } from "./actions";

// Блок «Уведомления в Telegram» в кабинете.
export default function TelegramConnect({
  connected,
}: {
  connected: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function connect() {
    setError("");
    setBusy(true);
    const res = await createTelegramLink();
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    if (res?.url) {
      setLink(res.url);
      window.open(res.url, "_blank", "noopener");
    }
  }

  async function disconnect() {
    setBusy(true);
    await disconnectTelegram();
    setBusy(false);
    setLink(null);
    router.refresh();
  }

  return (
    <section className="panel mt-10 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow">Уведомления в Telegram</span>
          <p className="mt-2 text-sm text-muted">
            {connected
              ? "Подключено. Присылаем новые сообщения и отклики в Telegram."
              : "Подключите Telegram, чтобы не пропускать новые сообщения и отклики."}
          </p>
        </div>

        {connected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className="shrink-0 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:border-red-500/50 hover:text-red-300 disabled:opacity-50"
          >
            {busy ? "…" : "Отключить"}
          </button>
        ) : (
          <button
            type="button"
            onClick={connect}
            disabled={busy}
            className="btn-accent shrink-0 px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {busy ? "…" : "Подключить"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* После генерации ссылки — инструкция */}
      {!connected && link && (
        <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-sm">
          <p className="text-foreground/90">
            1. Откройте бота (откроется в новой вкладке) и нажмите{" "}
            <b>Start</b>.
            <br />
            2. Вернитесь сюда и нажмите «Я нажал Start».
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent px-4 py-2 text-sm"
            >
              Открыть бота
            </a>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/60"
            >
              Я нажал Start
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
