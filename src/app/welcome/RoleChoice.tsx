"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { chooseRole } from "./actions";

type Role = "EDITOR" | "EMPLOYER";

export default function RoleChoice() {
  const router = useRouter();
  const [busy, setBusy] = useState<Role | null>(null);
  const [error, setError] = useState("");

  async function pick(role: Role) {
    setError("");
    setBusy(role);
    const res = await chooseRole(role);
    if (res?.error) {
      setError(res.error);
      setBusy(null);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const cards: { role: Role; title: string; text: string; cta: string }[] = [
    {
      role: "EDITOR",
      title: "Я монтажёр",
      text: "Создам резюме с шоурилом и буду откликаться на вакансии.",
      cta: "Я ищу работу →",
    },
    {
      role: "EMPLOYER",
      title: "Я работодатель",
      text: "Буду искать монтажёров в каталоге и размещать вакансии.",
      cta: "Я ищу монтажёра →",
    },
  ];

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <button
            key={c.role}
            type="button"
            onClick={() => pick(c.role)}
            disabled={busy !== null}
            className="panel panel-link flex flex-col p-6 text-left disabled:opacity-60"
          >
            <h2 className="font-display text-xl font-bold">{c.title}</h2>
            <p className="mt-1.5 text-sm text-muted">{c.text}</p>
            <span className="mt-4 text-sm font-medium text-accent-light">
              {busy === c.role ? "Сохраняем…" : c.cta}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
