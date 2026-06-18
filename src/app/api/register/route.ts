// "Приёмная" регистрации: создаёт нового пользователя и пустой профиль под роль.
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { name, email, password, role } = body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  // Простые проверки полей.
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Пароль должен быть не короче 6 символов" },
      { status: 400 }
    );
  }
  if (role !== "EDITOR" && role !== "EMPLOYER") {
    return NextResponse.json({ error: "Неизвестная роль" }, { status: 400 });
  }

  // Проверяем, не занят ли email.
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Пользователь с таким email уже существует" },
      { status: 409 }
    );
  }

  // Шифруем пароль (в базу попадёт только "отпечаток", не сам пароль).
  const passwordHash = await bcrypt.hash(password, 10);

  // Создаём пользователя и сразу заводим профиль под его роль.
  // Обязательные поля профиля заполняем заглушками — человек уточнит их позже
  // при заполнении резюме/профиля.
  await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      ...(role === "EDITOR"
        ? { editorProfile: { create: { headline: "Монтажёр" } } }
        : {
            employerProfile: {
              create: { displayName: name, type: "BLOGGER" },
            },
          }),
    },
  });

  return NextResponse.json({ ok: true });
}
