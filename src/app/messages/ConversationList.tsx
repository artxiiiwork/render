"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@/components/Avatar";

type Item = {
  id: string;
  name: string;
  avatar: string | null;
  last: string | null;
  unread: boolean;
  support: boolean;
};

export default function ConversationList({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const [q, setQ] = useState("");

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border p-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск"
          className="field"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted">
            {items.length === 0 ? "Переписок пока нет." : "Ничего не найдено."}
          </p>
        ) : (
          filtered.map((i) => {
            const active = pathname === `/messages/${i.id}`;
            return (
              <Link
                key={i.id}
                href={`/messages/${i.id}`}
                className={`flex items-center gap-3 border-b border-border/40 px-3 py-3 transition ${
                  active ? "bg-accent-soft" : "hover:bg-white/5"
                }`}
              >
                {i.support ? (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2a7 7 0 0 0-7 7v4a3 3 0 0 0 3 3h1v-7H7V9a5 5 0 0 1 10 0v3h-2v7h1a3 3 0 0 0 3-3V9a7 7 0 0 0-7-7Z" />
                    </svg>
                  </span>
                ) : (
                  <Avatar src={i.avatar} name={i.name} size={44} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-medium text-foreground">
                    {i.name}
                    {i.support && (
                      <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        Поддержка
                      </span>
                    )}
                  </p>
                  <p
                    className={`truncate text-sm ${
                      i.unread ? "font-medium text-foreground" : "text-muted"
                    }`}
                  >
                    {i.last ?? "Нет сообщений"}
                  </p>
                </div>
                {i.unread && (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
