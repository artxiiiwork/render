// Подсчёт сводного рейтинга по списку оценок отзывов.

export type RatingSummary = {
  average: number; // среднее 0..5 (0, если отзывов нет)
  count: number; // сколько отзывов
};

export function summarizeRatings(ratings: number[]): RatingSummary {
  if (ratings.length === 0) return { average: 0, count: 0 };
  const sum = ratings.reduce((a, r) => a + r, 0);
  return {
    average: Math.round((sum / ratings.length) * 10) / 10, // один знак после запятой
    count: ratings.length,
  };
}

// Склонение слова «отзыв»: 1 отзыв, 2 отзыва, 5 отзывов.
export function pluralReviews(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return "отзывов";
  if (mod10 === 1) return "отзыв";
  if (mod10 >= 2 && mod10 <= 4) return "отзыва";
  return "отзывов";
}

// Бонус к баллу качества за рейтинг (используется в ранжировании каталога).
// Нет отзывов — нет бонуса. Дальше: близость к 5 звёздам + немного за их число.
export function ratingBonus(summary: RatingSummary): number {
  if (summary.count === 0) return 0;
  return (summary.average / 5) * 20 + Math.min(summary.count, 5) * 2;
}
