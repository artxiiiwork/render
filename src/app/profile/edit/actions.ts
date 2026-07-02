"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  WorkFormat,
  PayPeriod,
  EditorStatus,
  EmployerType,
} from "@prisma/client";
import { SECTION_VALUES, GAME_VALUES, GAMES_SECTION } from "@/lib/taxonomy";
import { videoKey } from "@/lib/embed";

// Допустимые значения справочников (берём прямо из базы — не разойдутся).
const WORK_FORMATS = Object.values(WorkFormat) as string[];
const PAY_PERIODS = Object.values(PayPeriod) as string[];
const STATUSES = Object.values(EditorStatus) as string[];
const EMPLOYER_TYPES = Object.values(EmployerType) as string[];

// Сохранение резюме монтажёра.
export async function saveEditorProfile(input: {
  headline: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  skills: string[];
  software: string[];
  sections: string[];
  games: string[];
  languages: string[];
  experienceYears: number | null;
  workFormats: string[];
  payMin: number | null;
  payMax: number | null;
  payPeriod: string | null;
  city: string;
  remote: boolean;
  status: string;
  portfolio: { url: string; title: string }[];
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Вы не авторизованы" };
  }
  if (session.user.role !== "EDITOR") {
    return { error: "Эта форма только для монтажёров" };
  }

  const headline = input.headline.trim();
  if (!headline) {
    return { error: "Укажите заголовок/специализацию" };
  }

  // Оставляем только допустимые значения и чистим списки от пустого.
  const sections = input.sections.filter((s) => SECTION_VALUES.includes(s));
  // игры — только если выбран раздел «Игры».
  const games = sections.includes(GAMES_SECTION)
    ? input.games.filter((g) => GAME_VALUES.includes(g))
    : [];
  const workFormats = input.workFormats.filter((f) =>
    WORK_FORMATS.includes(f)
  ) as WorkFormat[];
  const skills = input.skills.map((s) => s.trim()).filter(Boolean);
  const software = input.software.map((s) => s.trim()).filter(Boolean);
  const languages = input.languages.map((s) => s.trim()).filter(Boolean);
  const payPeriod =
    input.payPeriod && PAY_PERIODS.includes(input.payPeriod)
      ? (input.payPeriod as PayPeriod)
      : null;
  const status = STATUSES.includes(input.status)
    ? (input.status as EditorStatus)
    : EditorStatus.SEEKING;
  // Портфолио: убираем пустые строки и дубли (один и тот же ролик в разных
  // формах ссылки — youtu.be / watch?v= — считается одним), а раздел ролика,
  // выставленный на странице резюме, сохраняем — иначе редактирование резюме
  // стирало бы разметку по разделам и порядок галереи.
  const existing = await prisma.portfolioLink.findMany({
    where: { editorProfile: { userId: session.user.id } },
    select: { url: true, section: true },
  });
  const sectionByKey = new Map(
    existing.map((l) => [videoKey(l.url), l.section])
  );
  const seen = new Set<string>();
  const portfolio: {
    url: string;
    title: string | null;
    section: string | null;
    position: number;
  }[] = [];
  for (const p of input.portfolio) {
    const url = p.url.trim();
    if (!url) continue;
    const key = videoKey(url);
    if (seen.has(key)) continue; // дубль — пропускаем
    seen.add(key);
    portfolio.push({
      url,
      title: p.title.trim() || null,
      section: sectionByKey.get(key) ?? null,
      position: portfolio.length,
    });
  }

  await prisma.editorProfile.update({
    where: { userId: session.user.id },
    data: {
      headline,
      bio: input.bio.trim() || null,
      avatarUrl: input.avatarUrl.trim() || null,
      coverUrl: input.coverUrl.trim() || null,
      skills,
      software,
      sections,
      games,
      languages,
      experienceYears: input.experienceYears,
      workFormats,
      payMin: input.payMin,
      payMax: input.payMax,
      payPeriod,
      city: input.city.trim() || null,
      remote: input.remote,
      status,
      // Портфолио перезаписываем целиком: удаляем старые ссылки и пишем новые.
      portfolio: {
        deleteMany: {},
        create: portfolio,
      },
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

// Сохранение профиля работодателя.
export async function saveEmployerProfile(input: {
  displayName: string;
  type: string;
  description: string;
  channelUrl: string;
  logoUrl: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Вы не авторизованы" };
  }
  if (session.user.role !== "EMPLOYER") {
    return { error: "Эта форма только для работодателей" };
  }

  const displayName = input.displayName.trim();
  if (!displayName) {
    return { error: "Укажите название или имя" };
  }
  const type = EMPLOYER_TYPES.includes(input.type)
    ? (input.type as EmployerType)
    : EmployerType.BLOGGER;

  await prisma.employerProfile.update({
    where: { userId: session.user.id },
    data: {
      displayName,
      type,
      description: input.description.trim() || null,
      channelUrl: input.channelUrl.trim() || null,
      logoUrl: input.logoUrl.trim() || null,
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
