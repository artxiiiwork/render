import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

// Карта сайта для поисковиков: главная, каталоги, все публичные профили и
// открытые вакансии. Поисковик берёт её по адресу /sitemap.xml.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [editors, vacancies] = await Promise.all([
    prisma.editorProfile.findMany({ select: { id: true, updatedAt: true } }),
    prisma.vacancy.findMany({
      where: { status: "OPEN" },
      select: { id: true, updatedAt: true },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/editors`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/vacancies`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const editorPages: MetadataRoute.Sitemap = editors.map((e) => ({
    url: `${SITE_URL}/editors/${e.id}`,
    lastModified: e.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const vacancyPages: MetadataRoute.Sitemap = vacancies.map((v) => ({
    url: `${SITE_URL}/vacancies/${v.id}`,
    lastModified: v.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...editorPages, ...vacancyPages];
}
