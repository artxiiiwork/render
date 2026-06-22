import Link from "next/link";
import MascotSlot from "@/components/MascotSlot";

// 404 — страница не найдена. Утилитарный экран → место под маскота.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <MascotSlot size={120} caption="Такого кадра нет — страница не нашлась." />
      <div>
        <h1 className="font-display text-4xl font-black text-foreground">404</h1>
        <p className="mt-2 text-muted">Страница не найдена или была снята.</p>
      </div>
      <Link href="/" className="btn-accent px-6 py-3">
        На главную
      </Link>
    </main>
  );
}
