// Слот под 3D-маскота RENDER («рендер-оператор»). Ассет делает 3D-команда
// отдельно. Пока показываем аккуратную заглушку с подсветкой — когда появится
// файл, достаточно заменить ВНУТРЕННОСТЬ этого компонента на
// <img src="/mascot/<вариант>.png" .../> (или Lottie), и маскот появится во
// всех местах сразу: загрузка, пустые состояния, 404, онбординг.
//
// ВАЖНО: ставим маскота только в утилитарных/«человеческих» местах, НЕ на
// основных рабочих экранах (каталог, профиль).
export default function MascotSlot({
  caption,
  size = 104,
}: {
  caption?: string;
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        className="flex items-center justify-center rounded-3xl border border-dashed border-border"
        style={{
          width: size,
          height: size,
          backgroundColor: "var(--surface-2)",
          backgroundImage:
            "radial-gradient(120% 100% at 50% 0%, rgba(124,58,237,0.22), transparent 65%)",
        }}
        aria-hidden="true"
      >
        {/* Силуэт «оператора с визором» — намёк на будущего маскота. */}
        <svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 64 64"
          fill="none"
        >
          <rect
            x="15"
            y="11"
            width="34"
            height="38"
            rx="13"
            fill="var(--accent-light)"
            opacity="0.18"
          />
          <rect
            x="21"
            y="25"
            width="22"
            height="9"
            rx="4.5"
            fill="var(--accent-light)"
            opacity="0.9"
          />
          <path
            d="M24 49v4M40 49v4"
            stroke="var(--accent-light)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>
      {caption && <p className="max-w-xs text-sm text-muted">{caption}</p>}
    </div>
  );
}
