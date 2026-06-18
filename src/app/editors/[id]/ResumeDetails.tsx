"use client";

import { useEffect, useState } from "react";

type Props = {
  name: string;
  headline: string;
  formats: string[];
  software: string[];
  skills: string[];
  workFormats: string[];
  languages: string[];
  experienceYears: number | null;
  where: string | null;
  pay: string | null;
};

// Кнопка «Подробнее» + модальное окно со всей информацией резюме.
export default function ResumeDetails(props: Props) {
  const [open, setOpen] = useState(false);

  // Закрытие по Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const {
    name,
    headline,
    formats,
    software,
    skills,
    workFormats,
    languages,
    experienceYears,
    where,
    pay,
  } = props;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground transition hover:border-accent/60 hover:text-accent"
      >
        Подробнее
      </button>

      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="modal-card max-h-[85vh] w-full max-w-xl overflow-y-auto p-6 sm:p-7">
            {/* Шапка окна */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="eyebrow">Резюме</span>
                <h2 className="mt-1.5 font-display text-2xl font-extrabold">
                  {name}
                </h2>
                <p className="text-sm text-muted">{headline}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                className="shrink-0 rounded-full border border-border px-3 py-2 text-sm text-muted transition hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Теги-группы */}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {formats.length > 0 && (
                <TagGroup label="Форматы" items={formats} />
              )}
              {software.length > 0 && (
                <TagGroup label="Софт" items={software} />
              )}
              {skills.length > 0 && <TagGroup label="Навыки" items={skills} />}
              {workFormats.length > 0 && (
                <TagGroup label="Формат работы" items={workFormats} />
              )}
              {languages.length > 0 && (
                <TagGroup label="Языки" items={languages} />
              )}
            </div>

            {/* Короткие факты */}
            {(experienceYears != null || where || pay) && (
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5 border-t border-border pt-5">
                {experienceYears != null && (
                  <Fact icon={<IconClock />}>Опыт: {experienceYears} лет</Fact>
                )}
                {where && <Fact icon={<IconPin />}>{where}</Fact>}
                {pay && <Fact icon={<IconMoney />}>{pay}</Fact>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Группа тегов-чипсов с маленьким заголовком.
function TagGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <span
            key={i}
            className="rounded-full border border-border bg-accent-soft px-2.5 py-1 text-xs text-foreground/90"
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

// Строка-факт: иконка слева + значение.
function Fact({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-foreground/90">
      <span className="shrink-0 text-muted">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function IconClock() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-7-5.686-7-11a7 7 0 1 1 14 0c0 5.314-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconMoney() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9v.01M18 15v.01" />
    </svg>
  );
}
