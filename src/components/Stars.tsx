// Отрисовка рейтинга звёздами (только показ, без интерактива).
// value — среднее 0..5; поддерживает половинки через градиентную заливку.

export default function Stars({
  value,
  size = 16,
}: {
  value: number;
  size?: number;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span
      className="inline-flex items-center gap-0.5 align-middle"
      aria-label={`Рейтинг ${value} из 5`}
    >
      {stars.map((i) => {
        // Доля заливки этой звезды: 0..1.
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span
            key={i}
            className="relative inline-block leading-none text-border"
            style={{ width: size, height: size, fontSize: size }}
          >
            <span aria-hidden="true">★</span>
            <span
              aria-hidden="true"
              className="absolute inset-0 overflow-hidden text-accent-light"
              style={{ width: `${fill * 100}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
    </span>
  );
}
