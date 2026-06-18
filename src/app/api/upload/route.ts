// "Приёмная" загрузки картинок (аватар монтажёра, логотип/обложка работодателя).
//
// Два режима — выбираются автоматически:
//  • ПРОДАКШЕН: если заданы переменные S3 (S3_BUCKET и доступы), файл уходит в
//    S3-совместимое объектное хранилище (Timeweb S3, Яндекс Object Storage и т.п.)
//    и возвращается постоянная ссылка. Это нужно, потому что на облачном хостинге
//    диск приложения временный — локально сохранённые файлы пропадают при
//    пересборке.
//  • РАЗРАБОТКА (на своём компьютере): переменных S3 нет → сохраняем в
//    public/uploads, как раньше, чтобы не требовать настройки облака при разработке.
//
// Форма (ImageUpload.tsx) и поля в базе (avatarUrl/logoUrl/coverUrl) не меняются —
// и там, и там это просто ссылка на картинку.
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

// Настройки S3 берём из переменных окружения. Если бакет не задан — значит
// хранилище не настроено и мы в режиме локальной разработки.
const S3_BUCKET = process.env.S3_BUCKET;
const S3_ENDPOINT = process.env.S3_ENDPOINT; // напр. https://s3.twcstorage.ru
const S3_REGION = process.env.S3_REGION || "ru-1";
// Публичная база для ссылок на файлы. Если не задана — собираем из endpoint+bucket.
const S3_PUBLIC_BASE =
  process.env.S3_PUBLIC_BASE_URL ||
  (S3_ENDPOINT && S3_BUCKET ? `${S3_ENDPOINT.replace(/\/$/, "")}/${S3_BUCKET}` : "");

function makeS3Client(): S3Client {
  return new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    forcePathStyle: true, // у большинства S3-совместимых хранилищ РФ путь вида /bucket/key
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
  });
}

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
  const key = `uploads/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  // ── Продакшен: S3-совместимое хранилище (Timeweb / Яндекс) ──
  if (S3_BUCKET) {
    const s3 = makeS3Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: file.type,
        ACL: "public-read",
      })
    );
    return NextResponse.json({ url: `${S3_PUBLIC_BASE}/${key}` });
  }

  // ── Разработка: сохраняем локально в public/uploads ──
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const fileName = key.replace(/^uploads\//, "");
  await writeFile(join(dir, fileName), bytes);

  return NextResponse.json({ url: `/uploads/${fileName}` });
}
