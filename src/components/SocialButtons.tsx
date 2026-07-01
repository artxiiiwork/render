"use client";

import { signIn } from "next-auth/react";
import { SOCIAL_LABELS, type SocialProvider } from "@/lib/socialProviders";

// Кнопки входа через соцсети. Показываются только те провайдеры, что включены
// на сервере (переданы в providers). Пусто — ничего не рисуем.
const DOT: Record<SocialProvider, string> = {
  yandex: "#FC3F1D",
  vk: "#0077FF",
};

export default function SocialButtons({
  providers,
  callbackUrl = "/dashboard",
}: {
  providers: SocialProvider[];
  callbackUrl?: string;
}) {
  if (providers.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-faint">или</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-4 space-y-2.5">
        {providers.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => signIn(p, { callbackUrl })}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-accent/60"
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: DOT[p] }}
            />
            Войти через {SOCIAL_LABELS[p]}
          </button>
        ))}
      </div>
    </div>
  );
}
