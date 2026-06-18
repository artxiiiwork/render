"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setVacancyStatus } from "../actions";

export default function VacancyStatusButton({
  vacancyId,
  status,
}: {
  vacancyId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isOpen = status === "OPEN";

  async function toggle() {
    setLoading(true);
    await setVacancyStatus(vacancyId, isOpen ? "CLOSED" : "OPEN");
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={toggle}
      className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:border-accent/60 hover:text-foreground disabled:opacity-50"
    >
      {loading ? "…" : isOpen ? "Закрыть вакансию" : "Открыть снова"}
    </button>
  );
}
