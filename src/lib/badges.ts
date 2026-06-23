// Значки-достижения монтажёра. Вычисляются из уже имеющихся данных (без новых
// полей) и показываются публично — это сигнал доверия для работодателя и
// мотивация для монтажёра. Порядок в списке = приоритет показа.

export type Badge = {
  key: string;
  label: string;
  icon: string;
};

export type BadgeInput = {
  reelCount: number;
  reviewCount: number;
  avgRating: number;
  experienceYears: number | null;
  status: string;
  strengthPercent?: number; // если известна «сила профиля» (есть не везде)
};

export function editorBadges(input: BadgeInput): Badge[] {
  const badges: Badge[] = [];

  // Отзывы: «Рекомендуют» — сильный сигнал, иначе просто «Есть отзывы».
  if (input.reviewCount >= 3 && input.avgRating >= 4.5) {
    badges.push({ key: "recommended", label: "Рекомендуют", icon: "⭐" });
  } else if (input.reviewCount >= 1) {
    badges.push({ key: "reviewed", label: "Есть отзывы", icon: "💬" });
  }

  // Портфолио: насыщенное или хотя бы один ролик.
  if (input.reelCount >= 4) {
    badges.push({ key: "portfolio", label: "Большое портфолио", icon: "📁" });
  } else if (input.reelCount >= 1) {
    badges.push({ key: "showreel", label: "Шоурил", icon: "🎬" });
  }

  // Опыт.
  if (input.experienceYears != null && input.experienceYears >= 3) {
    badges.push({ key: "experienced", label: "Опытный", icon: "🏅" });
  }

  // Полностью заполненный профиль (если знаем силу профиля).
  if (input.strengthPercent != null && input.strengthPercent >= 100) {
    badges.push({ key: "complete", label: "Профиль заполнен", icon: "✨" });
  }

  // Открыт к работе.
  if (input.status === "SEEKING") {
    badges.push({ key: "open", label: "Открыт к работе", icon: "✅" });
  }

  return badges;
}
