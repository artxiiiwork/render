"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  ContentFormat,
  WorkFormat,
  PayPeriod,
  EditorStatus,
  EmployerType,
} from "@prisma/client";

// Допустимые значения справочников (берём прямо из базы — не разойдутся).
const FORMATS = Object.values(ContentFormat) as string[];
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
  formats: string[];
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
  const formats = input.formats.filter((f) => FORMATS.includes(f)) as ContentFormat[];
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
  const portfolio = input.portfolio
    .filter((p) => p.url.trim())
    .map((p) => ({ url: p.url.trim(), title: p.title.trim() || null }));

  await prisma.editorProfile.update({
    where: { userId: session.user.id },
    data: {
      headline,
      bio: input.bio.trim() || null,
      avatarUrl: input.avatarUrl.trim() || null,
      coverUrl: input.coverUrl.trim() || null,
      skills,
      software,
      formats,
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
