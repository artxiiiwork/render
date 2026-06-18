"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationStatus } from "../actions";

export default function ApplicationActions({
  applicationId,
  status,
}: {
  applicationId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(next: string) {
    setLoading(true);
    await updateApplicationStatus(applicationId, next);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {status !== "INVITED" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("INVITED")}
          className="rounded-full border border-green-400/40 px-3 py-1.5 text-xs font-medium text-green-300 transition hover:bg-green-500/10 disabled:opacity-50"
        >
          Пригласить
        </button>
      )}
      {status !== "REJECTED" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("REJECTED")}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
        >
          Отказать
        </button>
      )}
    </div>
  );
}
