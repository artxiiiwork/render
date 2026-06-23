import Link from "next/link";

// Простая постраничная навигация: «← Назад», «Стр. N из M», «Вперёд →».
// Сохраняет другие параметры адреса (фильтры).
export default function Pagination({
  basePath,
  page,
  totalPages,
  extraParams = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  extraParams?: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(extraParams)) {
      if (Array.isArray(value)) {
        for (const v of value) if (v) params.append(key, v);
      } else if (value) {
        params.set(key, value);
      }
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const linkClass =
    "rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/60";
  const disabledClass =
    "rounded-full border border-border/50 px-4 py-2 text-sm font-medium text-muted/40";

  return (
    <div className="mt-8 flex items-center justify-between">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>
          ← Назад
        </Link>
      ) : (
        <span className={disabledClass}>← Назад</span>
      )}

      <span className="text-sm text-muted">
        Стр. {page} из {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={linkClass}>
          Вперёд →
        </Link>
      ) : (
        <span className={disabledClass}>Вперёд →</span>
      )}
    </div>
  );
}
