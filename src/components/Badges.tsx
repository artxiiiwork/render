import type { Badge } from "@/lib/badges";

// Показ значков-достижений. compact — иконки покрупнее без подписей (для карточек
// каталога), обычный режим — иконка + подпись чипом (для страницы профиля).
export default function Badges({
  badges,
  compact = false,
  limit,
}: {
  badges: Badge[];
  compact?: boolean;
  limit?: number;
}) {
  const list = limit ? badges.slice(0, limit) : badges;
  if (list.length === 0) return null;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1">
        {list.map((b) => (
          <span
            key={b.key}
            title={b.label}
            aria-label={b.label}
            className="text-sm leading-none"
          >
            {b.icon}
          </span>
        ))}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((b) => (
        <span
          key={b.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground/90"
        >
          <span aria-hidden="true">{b.icon}</span>
          {b.label}
        </span>
      ))}
    </div>
  );
}
