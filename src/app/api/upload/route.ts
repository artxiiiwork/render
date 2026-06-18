// "Приёмная" загрузки картинок (аватар монтажёра, логотип/обложка работодателя).
//
// Два режима — выбираются автоматически:
//  • ПРОДАКШЕН (Vercel): если задан BLOB_READ_WRITE_TOKEN, файл уходит в
//    облачное хранилище Vercel Blob и возвращается постоянная ссылка. Это нужно
//    потому, что у Vercel диск временный — локально сохранённые файлы пропадают.
//  • РАЗРАБОТКА (на своём компьютере): токена нет → сохраняем в public/uploads,
//    как раньше, чтобы не требовать настройки облака во время разработки.
//
// Форма (ImageUpload.tsx) и поля в базе (avatarUrl/logoUrl/coverUrl) не меняются —
// и там, и там это просто ссылка на картинку.
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";
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

  // Случайное имя, чтобы файлы не перетирали друг друга.
  const fileName = `${randomUUID()}.${ext}`;

  // ── Продакшен: облачное хранилище Vercel Blob ──
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${fileName}`, file, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  }

  // ── Разработка: сохраняем локально в public/uploads ──
  const bytes = Buffer.from(await file.arrayBuffer());
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, fileName), bytes);

  return NextResponse.json({ url: `/uploads/${fileName}` });
}
