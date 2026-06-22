"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  WorkFormat,
  Employment,
  PayPeriod,
  VacancyStatus,
  ApplicationStatus,
} from "@prisma/client";
import { SECTION_VALUES, GAME_VALUES, GAMES_SECTION } from "@/lib/taxonomy";

const WORK_FORMATS = Object.values(WorkFormat) as string[];
const EMPLOYMENTS = Object.values(Employment) as string[];
const PAY_PERIODS = Object.values(PayPeriod) as string[];
const APP_STATUSES = Object.values(ApplicationStatus) as string[];

export type VacancyInput = {
  title: string;
  description: string;
  workFormat: string;
  employment: string;
  sections: string[];
  games: string[];
  software: string[];
  skills: string[];
  payMin: number | null;
  payMax: number | null;
  payPeriod: string | null;
  city: string;
  remote: boolean;
};

// Приводим введённые данные к виду для базы (общая часть create/update).
function normalize(input: VacancyInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) return { error: "Укажите заголовок вакансии" as const };
  if (!description) return { error: "Добавьте описание" as const };
  if (!WORK_FORMATS.includes(input.workFormat))
    return { error: "Выберите формат работы" as const };
  if (!EMPLOYMENTS.includes(input.employment))
    return { error: "Выберите занятость" as const };

  return {
    data: {
      title,
      description,
      workFormat: input.workFormat as WorkFormat,
      employment: input.employment as Employment,
      sections: input.sections.filter((s) => SECTION_VALUES.includes(s)),
      games: input.sections.includes(GAMES_SECTION)
        ? input.games.filter((g) => GAME_VALUES.includes(g))
        : [],
      software: input.software.map((s) => s.trim()).filter(Boolean),
      skills: input.skills.map((s) => s.trim()).filter(Boolean),
      payMin: input.payMin,
      payMax: input.payMax,
      payPeriod:
        input.payPeriod && PAY_PERIODS.includes(input.payPeriod)
          ? (input.payPeriod as PayPeriod)
          : null,
      city: input.city.trim() || null,
      remote: input.remote,
    },
  };
}

// Создание вакансии работодателем.
export async function createVacancy(input: VacancyInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };
  if (session.user.role !== "EMPLOYER")
    return { error: "Размещать вакансии могут только работодатели" };

  const res = normalize(input);
  if ("error" in res) return { error: res.error };

  const vacancy = await prisma.vacancy.create({
    data: { ...res.data, employerId: session.user.id },
  });

  revalidatePath("/vacancies");
  revalidatePath("/dashboard");
  return { ok: true, id: vacancy.id };
}

// Редактирование вакансии (только своей).
export async function updateVacancy(id: string, input: VacancyInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };

  const vacancy = await prisma.vacancy.findUnique({ where: { id } });
  if (!vacancy || vacancy.employerId !== session.user.id)
    return { error: "Это не ваша вакансия" };

  const res = normalize(input);
  if ("error" in res) return { error: res.error };

  await prisma.vacancy.update({ where: { id }, data: res.data });

  revalidatePath("/vacancies");
  revalidatePath(`/vacancies/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, id };
}

// Открыть/закрыть вакансию (только свою).
export async function setVacancyStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };

  const vacancy = await prisma.vacancy.findUnique({ where: { id } });
  if (!vacancy || vacancy.employerId !== session.user.id)
    return { error: "Это не ваша вакансия" };
  if (status !== "OPEN" && status !== "CLOSED")
    return { error: "Неизвестный статус" };

  await prisma.vacancy.update({
    where: { id },
    data: { status: status as VacancyStatus },
  });

  revalidatePath("/vacancies");
  revalidatePath(`/vacancies/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

// Отклик монтажёра на вакансию.
export async function applyToVacancy(vacancyId: string, message: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };
  if (session.user.role !== "EDITOR")
    return { error: "Откликаться могут только монтажёры" };

  const text = message.trim();
  if (!text) return { error: "Напишите пару слов о себе" };

  const vacancy = await prisma.vacancy.findUnique({ where: { id: vacancyId } });
  if (!vacancy) return { error: "Вакансия не найдена" };
  if (vacancy.status !== "OPEN")
    return { error: "Вакансия закрыта — откликнуться нельзя" };

  // Один отклик на вакансию (защита от повторов).
  const existing = await prisma.application.findUnique({
    where: { vacancyId_editorId: { vacancyId, editorId: session.user.id } },
  });
  if (existing) return { error: "Вы уже откликнулись на эту вакансию" };

  await prisma.application.create({
    data: { vacancyId, editorId: session.user.id, message: text },
  });

  revalidatePath(`/vacancies/${vacancyId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

// Работодатель меняет статус отклика на свою вакансию.
export async function updateApplicationStatus(
  applicationId: string,
  status: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };
  if (!APP_STATUSES.includes(status))
    return { error: "Неизвестный статус" };

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { vacancy: { select: { employerId: true, id: true } } },
  });
  if (!application || application.vacancy.employerId !== session.user.id)
    return { error: "Это не ваша вакансия" };

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: status as ApplicationStatus },
  });

  revalidatePath(`/vacancies/${application.vacancy.id}`);
  return { ok: true };
}
