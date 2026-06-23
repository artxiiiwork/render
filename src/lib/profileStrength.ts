// «Сила профиля» — чек-лист заполненности резюме монтажёра.
// Те же сигналы, что и в ранжировании (src/lib/ranking.ts), но показанные
// владельцу понятным списком: что уже сделано и что добавить, чтобы подняться
// в каталоге. Честная связка: заполнил пункт → вырос балл → выше в поиске.

export type ProfileStrengthInput = {
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  sections: string[];
  software: string[];
  skills: string[];
  payMin: number | null;
  reelCount: number;
  hasReviews: boolean;
};

export type ChecklistItem = {
  label: string; // что нужно сделать
  done: boolean;
};

export type ProfileStrength = {
  items: ChecklistItem[];
  doneCount: number;
  total: number;
  percent: number; // 0..100
  level: string; // словесная оценка
};

export function profileStrength(input: ProfileStrengthInput): ProfileStrength {
  const items: ChecklistItem[] = [
    { label: "Добавить шоурил (хотя бы один ролик)", done: input.reelCount > 0 },
    { label: "Загрузить аватар", done: !!input.avatarUrl },
    { label: "Загрузить обложку профиля", done: !!input.coverUrl },
    {
      label: "Заполнить «О себе» (от 60 символов)",
      done: !!input.bio && input.bio.trim().length >= 60,
    },
    { label: "Указать раздел/нишу", done: input.sections.length > 0 },
    { label: "Указать софт (от 2 программ)", done: input.software.length >= 2 },
    { label: "Добавить навыки (от 3 тегов)", done: input.skills.length >= 3 },
    { label: "Указать ставку", done: input.payMin != null },
    { label: "Получить первый отзыв", done: input.hasReviews },
  ];

  const total = items.length;
  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.round((doneCount / total) * 100);

  const level =
    percent >= 100
      ? "Профиль на максимум"
      : percent >= 70
        ? "Сильный профиль"
        : percent >= 40
          ? "Профиль набирает силу"
          : "Профиль только начат";

  return { items, doneCount, total, percent, level };
}
