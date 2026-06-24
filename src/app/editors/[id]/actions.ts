"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SECTION_VALUES } from "@/lib/taxonomy";
import { videoKey } from "@/lib/embed";

// Раздел ролика: допустимое значение или null.
function cleanSection(section: string | null): string | null {
  return section && SECTION_VALUES.includes(section) ? section : null;
}

// Добавление ссылки на ролик в портфолио — прямо со страницы своего резюме.
// Монтажёр может дописывать только в СВОЙ профиль (берём его из сессии).
export async function addPortfolioLink(input: {
  url: string;
  title: string;
  section: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Вы не авторизованы" };
  }
  if (session.user.role !== "EDITOR") {
    return { error: "Только монтажёр может добавлять ролики" };
  }

  const url = input.url.trim();
  if (!url) {
    return { error: "Укажите ссылку на ролик" };
  }

  const profile = await prisma.editorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return { error: "Сначала заполните резюме" };
  }

  // Дедупликация: не добавляем ролик, который уже есть в портфолио
  // (защищает и от повторного клика, и от той же ссылки в другой форме).
  const existing = await prisma.portfolioLink.findMany({
    where: { editorProfileId: profile.id },
    select: { url: true },
  });
  const newKey = videoKey(url);
  if (existing.some((e) => videoKey(e.url) === newKey)) {
    return { error: "Этот ролик уже добавлен в портфолио" };
  }

  // Новый ролик встаёт в конец галереи.
  const count = existing.length;

  await prisma.portfolioLink.create({
    data: {
      url,
      title: input.title.trim() || null,
      section: cleanSection(input.section),
      position: count,
      editorProfileId: profile.id,
    },
  });

  revalidatePath(`/editors/${profile.id}`);
  return { ok: true };
}

// Профиль текущего монтажёра — общий помощник для действий ниже.
async function ownProfileId() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "EDITOR") return null;
  const profile = await prisma.editorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return profile?.id ?? null;
}

// Изменение блока «О себе» прямо со страницы профиля.
export async function updateBio(text: string) {
  const profileId = await ownProfileId();
  if (!profileId) return { error: "Нет доступа" };

  await prisma.editorProfile.update({
    where: { id: profileId },
    data: { bio: text.trim() || null },
  });

  revalidatePath(`/editors/${profileId}`);
  return { ok: true };
}

// Редактирование уже добавленного ролика (ссылка + описание).
export async function updatePortfolioLink(input: {
  id: string;
  url: string;
  title: string;
  section: string | null;
}) {
  const profileId = await ownProfileId();
  if (!profileId) return { error: "Нет доступа" };

  const url = input.url.trim();
  if (!url) return { error: "Укажите ссылку на ролик" };

  // Проверяем, что ролик принадлежит этому монтажёру.
  const link = await prisma.portfolioLink.findUnique({
    where: { id: input.id },
    select: { editorProfileId: true },
  });
  if (!link || link.editorProfileId !== profileId) {
    return { error: "Ролик не найден" };
  }

  await prisma.portfolioLink.update({
    where: { id: input.id },
    data: {
      url,
      title: input.title.trim() || null,
      section: cleanSection(input.section),
    },
  });

  revalidatePath(`/editors/${profileId}`);
  return { ok: true };
}

// Удаление ролика из портфолио.
export async function deletePortfolioLink(id: string) {
  const profileId = await ownProfileId();
  if (!profileId) return { error: "Нет доступа" };

  const link = await prisma.portfolioLink.findUnique({
    where: { id },
    select: { editorProfileId: true },
  });
  if (!link || link.editorProfileId !== profileId) {
    return { error: "Ролик не найден" };
  }

  await prisma.portfolioLink.delete({ where: { id } });

  revalidatePath(`/editors/${profileId}`);
  return { ok: true };
}

// Сохранение нового порядка роликов (после перетаскивания).
export async function reorderPortfolio(ids: string[]) {
  const profileId = await ownProfileId();
  if (!profileId) return { error: "Нет доступа" };

  // Все id должны принадлежать этому монтажёру.
  const links = await prisma.portfolioLink.findMany({
    where: { editorProfileId: profileId },
    select: { id: true },
  });
  const owned = new Set(links.map((l) => l.id));
  if (ids.length !== owned.size || !ids.every((id) => owned.has(id))) {
    return { error: "Список роликов не совпадает" };
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.portfolioLink.update({ where: { id }, data: { position: index } })
    )
  );

  revalidatePath(`/editors/${profileId}`);
  return { ok: true };
}

// ── Отзывы ────────────────────────────────────────────────────

// Оставить отзыв можно только тому, с кем была реальная переписка
// (не считая канала поддержки) и не самому себе. Возвращает id переписки,
// если она есть, иначе null.
async function conversationBetween(meId: string, otherId: string) {
  return prisma.conversation.findFirst({
    where: {
      isSupport: false,
      OR: [
        { employerId: meId, editorId: otherId },
        { employerId: otherId, editorId: meId },
      ],
    },
    select: { id: true },
  });
}

// Создать или обновить свой отзыв о пользователе (адресат — target).
// profileId нужен только чтобы обновить кэш страницы профиля монтажёра.
export async function submitReview(input: {
  targetUserId: string;
  profileId: string;
  rating: number;
  comment: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };
  const me = session.user.id;

  if (me === input.targetUserId) {
    return { error: "Нельзя оставить отзыв самому себе" };
  }

  const rating = Math.round(input.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { error: "Оценка должна быть от 1 до 5" };
  }

  const convo = await conversationBetween(me, input.targetUserId);
  if (!convo) {
    return {
      error: "Отзыв можно оставить только тому, с кем у вас была переписка",
    };
  }

  const comment = input.comment.trim() || null;

  await prisma.review.upsert({
    where: { authorId_targetId: { authorId: me, targetId: input.targetUserId } },
    create: { authorId: me, targetId: input.targetUserId, rating, comment },
    update: { rating, comment },
  });

  revalidatePath(`/editors/${input.profileId}`);
  return { ok: true };
}

// Удалить свой отзыв.
export async function deleteReview(input: {
  targetUserId: string;
  profileId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };

  await prisma.review.deleteMany({
    where: { authorId: session.user.id, targetId: input.targetUserId },
  });

  revalidatePath(`/editors/${input.profileId}`);
  return { ok: true };
}
