import Link from "next/link";
import type { ProfileStrength as Strength } from "@/lib/profileStrength";

// Панель «Сила профиля» — показываем только владельцу резюме. Шкала прогресса
// + список того, что ещё стоит заполнить (со ссылкой на редактирование).
export default function ProfileStrength({
  strength,
}: {
  strength: Strength;
}) {
  const { items, doneCount, total, percent, level } = strength;
  const todo = items.filter((i) => !i.done);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">Сила профиля</span>
        <span className="num text-sm text-muted">
          {doneCount}/{total}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="font-display text-2xl font-extrabold text-foreground">
          {percent}%
        </span>
        <span className="text-sm text-accent-light">{level}</span>
      </div>

      {/* Шкала */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {todo.length > 0 ? (
        <>
          <p className="mt-4 text-sm text-muted">
            Заполните, чтобы подняться выше в каталоге:
          </p>
          <ul className="mt-2 space-y-1.5">
            {todo.map((i) => (
              <li
                key={i.label}
                className="flex items-start gap-2 text-sm text-foreground/90"
              >
                <span className="mt-0.5 text-faint" aria-hidden="true">
                  ○
                </span>
                {i.label}
              </li>
            ))}
          </ul>
          <Link
            href="/profile/edit"
            className="btn-accent mt-4 inline-flex px-5 py-2 text-sm"
          >
            Дозаполнить резюме
          </Link>
        </>
      ) : (
        <p className="mt-4 text-sm text-foreground/90">
          Профиль полностью заполнен — отличная работа! 🎬
        </p>
      )}
    </div>
  );
}
