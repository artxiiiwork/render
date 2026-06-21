import Link from "next/link";

// Логотип RENDER — только иконка «Re» (без слова RENDER). Ведёт на главную.
// Размер по умолчанию подходит для шапки; можно переопределить через size.
export default function Logo({
  href = "/",
  size = 36,
}: {
  href?: string;
  size?: number;
}) {
  return (
    <Link href={href} aria-label="RENDER — на главную" className="inline-flex shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt="RENDER"
        width={size}
        height={size}
        className="rounded-[22%]"
      />
    </Link>
  );
}
