// Базовый адрес сайта — для абсолютных ссылок в метаданных, Open Graph,
// sitemap и robots. На проде задаём переменную NEXT_PUBLIC_SITE_URL; если её
// вдруг нет в сборке — подстраховываемся реальным боевым доменом (НЕ localhost,
// иначе ломается canonical/og:url в поисковиках).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://artxiiiwork-render-cd2e.twc1.net"
).replace(/\/$/, "");

export const SITE_NAME = "RENDER";

export const SITE_DESCRIPTION =
  "Ниша-доска для видеомонтажёров: игры, мобильный формат, YouTube, моушн, 3D. Смотрите шоурилы и пишите напрямую — без посредничества в оплате.";
