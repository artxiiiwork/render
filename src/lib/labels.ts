// Общие "человеческие" подписи для значений из базы.
// Держим их в одном месте, чтобы не дублировать по всему коду.

// Разделы-ниши и игры теперь в src/lib/taxonomy.ts (заменили старые «форматы»).

// Формат найма (WorkFormat).
export const WORK_FORMAT_OPTIONS = [
  { value: "STAFF", label: "Штат" },
  { value: "ONGOING", label: "Постоянное сотрудничество" },
  { value: "PROJECT", label: "Проекты" },
] as const;

// Занятость (Employment).
export const EMPLOYMENT_OPTIONS = [
  { value: "FULL_TIME", label: "Полная" },
  { value: "PART_TIME", label: "Частичная" },
  { value: "PROJECT_BASED", label: "Проектная" },
] as const;

// Период оплаты (PayPeriod).
export const PAY_PERIOD_OPTIONS = [
  { value: "PER_PROJECT", label: "за проект" },
  { value: "PER_HOUR", label: "за час" },
  { value: "PER_MONTH", label: "в месяц" },
] as const;

// Тип работодателя (EmployerType).
export const EMPLOYER_TYPE_OPTIONS = [
  { value: "BLOGGER", label: "Блогер / канал" },
  { value: "STUDIO", label: "Студия" },
  { value: "AGENCY", label: "Агентство" },
  { value: "BRAND", label: "Бренд / компания" },
] as const;

// Доступность монтажёра (EditorStatus).
export const EDITOR_STATUS_OPTIONS = [
  { value: "SEEKING", label: "Ищу работу" },
  { value: "OPEN", label: "Открыт к предложениям" },
  { value: "NOT_LOOKING", label: "Сейчас не ищу" },
] as const;

// Быстрые подписи "значение → текст".
function toLabels(opts: readonly { value: string; label: string }[]) {
  return Object.fromEntries(opts.map((o) => [o.value, o.label]));
}

export const WORK_FORMAT_LABELS = toLabels(WORK_FORMAT_OPTIONS);
export const EMPLOYMENT_LABELS = toLabels(EMPLOYMENT_OPTIONS);
export const PAY_PERIOD_LABELS = toLabels(PAY_PERIOD_OPTIONS);
export const EMPLOYER_TYPE_LABELS = toLabels(EMPLOYER_TYPE_OPTIONS);
export const EDITOR_STATUS_LABELS = toLabels(EDITOR_STATUS_OPTIONS);

// Цвета "плашки" доступности монтажёра (классы Tailwind, тёмная тема).
export const EDITOR_STATUS_STYLES: Record<string, string> = {
  SEEKING: "bg-green-500/15 text-green-300",
  OPEN: "bg-accent/15 text-accent",
  NOT_LOOKING: "bg-white/5 text-muted",
};

// Статус отклика (ApplicationStatus).
export const APPLICATION_STATUS_OPTIONS = [
  { value: "NEW", label: "Новый" },
  { value: "VIEWED", label: "Просмотрен" },
  { value: "INVITED", label: "Приглашён" },
  { value: "REJECTED", label: "Отказ" },
] as const;

export const APPLICATION_STATUS_LABELS = toLabels(APPLICATION_STATUS_OPTIONS);

export const APPLICATION_STATUS_STYLES: Record<string, string> = {
  NEW: "bg-accent/15 text-accent",
  VIEWED: "bg-white/5 text-muted",
  INVITED: "bg-green-500/15 text-green-300",
  REJECTED: "bg-red-500/15 text-red-300",
};

// Статус вакансии (VacancyStatus).
export const VACANCY_STATUS_LABELS: Record<string, string> = {
  OPEN: "Открыта",
  CLOSED: "Закрыта",
};

// Красиво показываем вилку оплаты, например "от 1 500 ₽ за час".
export function formatPay(
  min: number | null,
  max: number | null,
  period: string | null
): string | null {
  if (min == null && max == null) return null;
  const f = (n: number) => n.toLocaleString("ru-RU");
  let amount: string;
  if (min != null && max != null) amount = `${f(min)}–${f(max)} ₽`;
  else if (min != null) amount = `от ${f(min)} ₽`;
  else amount = `до ${f(max as number)} ₽`;
  const per = period ? PAY_PERIOD_LABELS[period] : null;
  return per ? `${amount} ${per}` : amount;
}
