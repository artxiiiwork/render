"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Добавление ссылки на ролик в портфолио — прямо со страницы своего резюме.
// Монтажёр может дописывать только в СВОЙ профиль (берём его из сессии).
export async function addPortfolioLink(input: { url: string; title: string }) {
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

  // Новый ролик встаёт в конец галереи.
  const count = await prisma.portfolioLink.count({
    where: { editorProfileId: profile.id },
  });

  await prisma.portfolioLink.create({
    data: {
      url,
      title: input.title.trim() || null,
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
    data: { url, title: input.title.trim() || null },
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
