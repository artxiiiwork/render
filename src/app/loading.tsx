import MascotSlot from "@/components/MascotSlot";

// Экран загрузки (показывается, пока страница готовит данные). «Идёт рендер…» —
// утилитарный момент → место под маскота.
export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <MascotSlot size={120} caption="Идёт рендер…" />
    </main>
  );
}
