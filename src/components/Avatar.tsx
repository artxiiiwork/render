// Аватар: картинка, либо кружок с первой буквой имени.
export default function Avatar({
  src,
  name,
  size = 48,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-accent-soft"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span
          className="font-display font-bold text-accent"
          style={{ fontSize: Math.round(size * 0.4) }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}
