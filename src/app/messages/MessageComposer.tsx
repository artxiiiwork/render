"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "./actions";

export default function MessageComposer({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setLoading(true);
    const res = await sendMessage(conversationId, body);
    setLoading(false);
    if (res?.ok) {
      setText("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Сообщение…"
        className="field flex-1"
      />
      <button
        type="submit"
        disabled={loading}
        className="btn-accent px-6 py-2.5 disabled:opacity-50"
      >
        {loading ? "…" : "Отправить"}
      </button>
    </form>
  );
}
