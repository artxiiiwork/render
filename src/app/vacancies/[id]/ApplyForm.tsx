"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyToVacancy } from "../actions";

export default function ApplyForm({ vacancyId }: { vacancyId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const r = await applyToVacancy(vacancyId, message);
    if (r?.error) {
      setError(r.error);
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea
        className="field"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Коротко о себе и почему подходите. Можно дать ссылку на работы."
        required
      />
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-accent px-6 py-2.5 disabled:opacity-50"
      >
        {loading ? "Отправляем…" : "Откликнуться"}
      </button>
    </form>
  );
}
