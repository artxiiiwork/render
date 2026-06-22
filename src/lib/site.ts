// Базовый адрес сайта — для абсолютных ссылок в метаданных, Open Graph,
// sitemap и robots. На проде задаём переменную NEXT_PUBLIC_SITE_URL
// (например https://render.ru); локально — localhost.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "RENDER";

export const SITE_DESCRIPTION =
  "Ниша-доска для видеомонтажёров: игры, мобильный формат, YouTube, моушн, 3D. Смотрите шоурилы и пишите напрямую — без посредничества в оплате.";
