"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Фиксированный системный аккаунт «Поддержка RENDER».
const SUPPORT_EMAIL = "support@render.system";

// Проверка, что текущий пользователь — администратор (флаг isAdmin в базе).
async function isAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  return Boolean(u?.isAdmin);
}

// Найти или создать системный аккаунт поддержки (войти под ним нельзя).
async function getSupportUserId() {
  const existing = await prisma.user.findUnique({
    where: { email: SUPPORT_EMAIL },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.user.create({
    data: {
      email: SUPPORT_EMAIL,
      name: "Поддержка RENDER",
      role: "EMPLOYER",
      passwordHash: "disabled", // не валидный bcrypt-хэш → вход невозможен
    },
    select: { id: true },
  });
  return created.id;
}

// Отправить пользователю сообщение от поддержки (в отдельный канал isSupport).
async function sendSupportMessage(toUserId: string, text: string) {
  const supportId = await getSupportUserId();
  if (supportId === toUserId) return;
  const convo = await prisma.conversation.upsert({
    where: {
      employerId_editorId: { employerId: supportId, editorId: toUserId },
    },
    create: { employerId: supportId, editorId: toUserId, isSupport: true },
    update: { updatedAt: new Date(), isSupport: true },
  });
  await prisma.message.create({
    data: { conversationId: convo.id, senderId: supportId, text },
  });
  revalidatePath("/messages");
}

// Удалить резюме монтажёра + уведомить его от поддержки с указанной причиной.
export async function deleteEditorProfileAdmin(id: string, reason: string) {
  if (!(await isAdmin())) return { error: "Нет доступа" };

  const profile = await prisma.editorProfile.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!profile) return { error: "Резюме не найдено" };

  await prisma.editorProfile.delete({ where: { id } });

  await sendSupportMessage(
    profile.userId,
    `Здравствуйте! Ваше резюме было снято модератором RENDER.\n\n` +
      `Причина: ${reason.trim() || "не указана"}\n\n` +
      `Вы можете заполнить резюме заново, учтя замечание.`
  );

  revalidatePath("/admin");
  return { ok: true };
}

// Удалить вакансию + уведомить работодателя от поддержки с указанной причиной.
export async function deleteVacancyAdmin(id: string, reason: string) {
  if (!(await isAdmin())) return { error: "Нет доступа" };

  const vacancy = await prisma.vacancy.findUnique({
    where: { id },
    select: { employerId: true, title: true },
  });
  if (!vacancy) return { error: "Вакансия не найдена" };

  await prisma.vacancy.delete({ where: { id } });

  await sendSupportMessage(
    vacancy.employerId,
    `Здравствуйте! Ваша вакансия «${vacancy.title}» была снята модератором RENDER.\n\n` +
      `Причина: ${reason.trim() || "не указана"}\n\n` +
      `Вы можете разместить вакансию заново, учтя замечание.`
  );

  revalidatePath("/admin");
  return { ok: true };
}
