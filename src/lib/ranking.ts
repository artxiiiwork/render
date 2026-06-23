// Ранжирование монтажёров по «качеству профиля».
// Идея: в каталоге (сортировка «По релевантности») выше показываем тех, у кого
// заполненный профиль, есть шоурил, открыт к работе и кто недавно активен.
// Это честный сигнал для работодателя и стимул монтажёрам доводить резюме до ума.
// Когда появятся отзывы — добавим рейтинг отдельным слагаемым.

export type RankableEditor = {
  headline: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  skills: string[];
  software: string[];
  sections: string[];
  payMin: number | null;
  experienceYears: number | null;
  status: string;
  updatedAt: Date;
  reelCount: number;
};

const DAY = 1000 * 60 * 60 * 24;

// Балл качества. Чем больше — тем выше в каталоге. Диапазон ~0..150.
export function editorQualityScore(e: RankableEditor): number {
  let score = 0;

  // Шоурил — самый важный сигнал. Первый ролик даёт много, дальше по убыванию.
  if (e.reelCount > 0) {
    score += 35;
    score += Math.min(e.reelCount - 1, 4) * 5; // +5 за каждый ролик до 5-го
  }

  // Заполненность профиля.
  if (e.avatarUrl) score += 8;
  if (e.coverUrl) score += 10;
  if (e.bio && e.bio.trim().length >= 60) score += 12;
  else if (e.bio && e.bio.trim().length > 0) score += 5;
  if (e.headline.trim().length > 3) score += 4;
  if (e.skills.length >= 3) score += 6;
  if (e.software.length >= 2) score += 6;
  if (e.sections.length > 0) score += 6;
  if (e.payMin != null) score += 6;
  if (e.experienceYears != null) score += 4;

  // Открыт к работе — поднимаем доступных.
  if (e.status === "SEEKING") score += 15;

  // Свежесть активности.
  const days = (Date.now() - e.updatedAt.getTime()) / DAY;
  if (days <= 7) score += 12;
  else if (days <= 30) score += 6;
  else if (days <= 90) score += 2;

  return score;
}

// Порог «ТОП»-значка: полностью собранный профиль с шоурилом.
export const TOP_SCORE_THRESHOLD = 90;

export function isTopEditor(score: number): boolean {
  return score >= TOP_SCORE_THRESHOLD;
}
