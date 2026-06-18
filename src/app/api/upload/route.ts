// "Приёмная" загрузки картинок (аватар монтажёра, логотип работодателя).
// Пока сохраняем файл прямо в проект (public/uploads) и отдаём ссылку на него.
// Ближе к запуску заменим на облачное хранилище (Яндекс Object Storage),
// при этом форма и поле в базе не изменятся — изменится только этот файл.
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Разрешённые типы картинок и их расширения.
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 МБ

export async function POST(req: Request) {
  // Загружать могут только вошедшие пользователи.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Вы не авторизованы" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не получен" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Можно загружать только картинки (JPG, PNG, WEBP, GIF)" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Файл слишком большой (максимум 5 МБ)" },
      { status: 400 }
    );
  }

  // Сохраняем под случайным именем, чтобы файлы не перетирали друг друга.
  const bytes = Buffer.from(await file.arrayBuffer());
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const fileName = `${randomUUID()}.${ext}`;
  await writeFile(join(dir, fileName), bytes);

  return NextResponse.json({ url: `/uploads/${fileName}` });
}
