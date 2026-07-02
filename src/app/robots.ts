import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Правила для поисковых роботов. Публичное (каталог, профили, вакансии)
// индексируем; личные разделы и API — закрываем.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/messages",
        "/applications",
        "/profile",
        "/admin",
        "/api",
        "/login",
        "/register",
        "/welcome",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
