// Таксономия RENDER: разделы-ниши (верхний уровень) и игры (подуровень у GAMES).
// Значения хранятся строками в базе (EditorProfile.sections/games,
// Vacancy.sections/games, PortfolioLink.section). Здесь — допустимые значения и
// человеческие подписи. Список можно расширять без миграции базы.

// Разделы верхнего уровня.
export const SECTION_OPTIONS = [
  { value: "GAMES", label: "Игры" },
  { value: "MOBILE", label: "Мобильный формат" },
  { value: "YOUTUBE", label: "YouTube — длинные" },
  { value: "MOTION", label: "Моушн-дизайн" },
  { value: "CGI3D", label: "3D / CGI" },
] as const;

// Подуровень «игра» — только для раздела «Игры». Без дробления по серверам.
export const GAME_OPTIONS = [
  { value: "SAMP", label: "SAMP / CRMP" },
  { value: "CS2", label: "CS2" },
  { value: "DOTA2", label: "Dota 2" },
  { value: "GTA", label: "GTA" },
  { value: "MINECRAFT", label: "Minecraft" },
  { value: "FORTNITE", label: "Fortnite" },
  { value: "VALORANT", label: "Valorant" },
  { value: "OTHER_GAME", label: "Другая игра" },
] as const;

// Значение раздела «Игры» — у него есть подуровень «игра».
export const GAMES_SECTION = "GAMES";

export const SECTION_VALUES = SECTION_OPTIONS.map((o) => o.value) as string[];
export const GAME_VALUES = GAME_OPTIONS.map((o) => o.value) as string[];

function toLabels(opts: readonly { value: string; label: string }[]) {
  return Object.fromEntries(opts.map((o) => [o.value, o.label]));
}

export const SECTION_LABELS = toLabels(SECTION_OPTIONS);
export const GAME_LABELS = toLabels(GAME_OPTIONS);

// Короткая строка вида «Игры · SAMP, CS2» для карточек и шапок.
export function sectionsSummary(
  sections: string[],
  games: string[]
): string {
  const parts = sections.map((s) => SECTION_LABELS[s] ?? s);
  const gameNames = games.map((g) => GAME_LABELS[g] ?? g);
  if (sections.includes(GAMES_SECTION) && gameNames.length > 0) {
    // К «Игры» добавляем перечень игр.
    const idx = parts.findIndex((p) => p === SECTION_LABELS[GAMES_SECTION]);
    if (idx >= 0) parts[idx] = `Игры · ${gameNames.join(", ")}`;
  }
  return parts.join(" · ");
}
