"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markConversationRead } from "./actions";

// Невидимый помощник: при открытии чата отмечает переписку прочитанной
// и обновляет страницу, чтобы счётчики непрочитанного слева пересчитались.
export default function MarkRead({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  useEffect(() => {
    markConversationRead(conversationId).then((res) => {
      if (res?.ok) router.refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);
  return null;
}
