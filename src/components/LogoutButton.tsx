"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-accent/60 hover:text-foreground"
    >
      Выйти
    </button>
  );
}
