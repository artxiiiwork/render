"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyTelegram } from "@/lib/telegram";
import { SITE_URL } from "@/lib/site";

// Открыть (или создать) переписку с другим пользователем.
// Переписка всегда между работодателем и монтажёром.
export async function openConversationWith(otherUserId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };
  if (otherUserId === session.user.id)
    return { error: "Нельзя написать самому себе" };

  const other = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { role: true },
  });
  if (!other) return { error: "Пользователь не найден" };

  // Определяем, кто из двоих работодатель, а кто монтажёр.
  let employerId: string;
  let editorId: string;
  if (session.user.role === "EMPLOYER" && other.role === "EDITOR") {
    employerId = session.user.id;
    editorId = otherUserId;
  } else if (session.user.role === "EDITOR" && other.role === "EMPLOYER") {
    employerId = otherUserId;
    editorId = session.user.id;
  } else {
    return { error: "Переписка возможна между работодателем и монтажёром" };
  }

  const conversation = await prisma.conversation.upsert({
    where: { employerId_editorId: { employerId, editorId } },
    create: { employerId, editorId },
    update: {},
  });

  return { ok: true, id: conversation.id };
}

// Написать первое сообщение пользователю: создаёт/находит переписку,
// сразу кладёт в неё сообщение и возвращает id переписки (для перехода в чат).
export async function messageUser(otherUserId: string, text: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };

  const body = text.trim();
  if (!body) return { error: "Введите сообщение" };
  if (otherUserId === session.user.id)
    return { error: "Нельзя написать самому себе" };

  const other = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { role: true },
  });
  if (!other) return { error: "Пользователь не найден" };

  let employerId: string;
  let editorId: string;
  if (session.user.role === "EMPLOYER" && other.role === "EDITOR") {
    employerId = session.user.id;
    editorId = otherUserId;
  } else if (session.user.role === "EDITOR" && other.role === "EMPLOYER") {
    employerId = otherUserId;
    editorId = session.user.id;
  } else {
    return { error: "Переписка возможна между работодателем и монтажёром" };
  }

  const conversation = await prisma.conversation.upsert({
    where: { employerId_editorId: { employerId, editorId } },
    create: { employerId, editorId },
    update: { updatedAt: new Date() },
  });

  await prisma.message.create({
    data: { conversationId: conversation.id, senderId: session.user.id, text: body },
  });

  // Уведомление в Telegram адресату (если подключил).
  await notifyTelegram(
    otherUserId,
    `💬 Новое сообщение на RENDER от ${session.user.name ?? "пользователя"}`,
    { text: "Открыть чат", url: `${SITE_URL}/messages/${conversation.id}` }
  );

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversation.id}`);
  return { ok: true, id: conversation.id };
}

// Отметить переписку прочитанной текущим пользователем (ставит метку времени).
export async function markConversationRead(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { employerId: true, editorId: true },
  });
  if (!conversation) return { error: "Переписка не найдена" };

  const now = new Date();
  if (conversation.employerId === session.user.id) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { employerLastReadAt: now },
    });
  } else if (conversation.editorId === session.user.id) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { editorLastReadAt: now },
    });
  } else {
    return { error: "Это не ваша переписка" };
  }

  revalidatePath("/messages");
  return { ok: true };
}

// Отправить сообщение в переписку (только её участник).
export async function sendMessage(conversationId: string, text: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };

  const body = text.trim();
  if (!body) return { error: "Пустое сообщение" };

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { employerId: true, editorId: true },
  });
  if (
    !conversation ||
    (conversation.employerId !== session.user.id &&
      conversation.editorId !== session.user.id)
  ) {
    return { error: "Это не ваша переписка" };
  }

  await prisma.message.create({
    data: { conversationId, senderId: session.user.id, text: body },
  });
  // Поднимаем переписку вверх списка.
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Уведомление в Telegram второй стороне переписки.
  const recipientId =
    conversation.employerId === session.user.id
      ? conversation.editorId
      : conversation.employerId;
  await notifyTelegram(
    recipientId,
    `💬 Новое сообщение на RENDER от ${session.user.name ?? "пользователя"}`,
    { text: "Открыть чат", url: `${SITE_URL}/messages/${conversationId}` }
  );

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return { ok: true };
}
