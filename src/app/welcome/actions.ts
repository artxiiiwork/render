"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";

// Выбор роли после первого входа через соцсеть. Ставит роль и заводит профиль
// под неё (как при обычной регистрации), затем обновляет сессию.
export async function chooseRole(role: "EDITOR" | "EMPLOYER") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Вы не авторизованы" };
  if (role !== "EDITOR" && role !== "EMPLOYER") {
    return { error: "Неизвестная роль" };
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true },
  });
  if (!me) return { error: "Пользователь не найден" };
  if (me.role) return { ok: true }; // роль уже выбрана раньше

  await prisma.user.update({
    where: { id: me.id },
    data: {
      role,
      ...(role === "EDITOR"
        ? { editorProfile: { create: { headline: "Монтажёр" } } }
        : {
            employerProfile: {
              create: { displayName: me.name, type: "BLOGGER" },
            },
          }),
    },
  });

  // Обновляем JWT-сессию, чтобы роль применилась сразу (без повторного входа).
  await unstable_update({ user: { role } });
  return { ok: true };
}
