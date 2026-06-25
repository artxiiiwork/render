"use client";

import { useRef, useState } from "react";

type Props = {
  label: string;
  value: string; // текущая ссылка на картинку ("" если нет)
  onChange: (url: string) => void;
  shape?: "circle" | "square";
  hint?: string;
  // Требование к пиксельным размерам (для баннера). Если задано — перед
  // загрузкой проверяем пропорцию и минимальную ширину файла.
  requiredRatio?: number; // ширина / высота, например 4 для 4:1
  minWidth?: number; // минимальная ширина в пикселях
  sizeLabel?: string; // подпись размера для сообщений, например "1600 × 400 px (4:1)"
};

// Узнать пиксельные размеры выбранного файла-картинки.
function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

// Выбор картинки с компьютера: загружает файл и отдаёт ссылку наверх.
export default function ImageUpload({
  label,
  value,
  onChange,
  shape = "circle",
  hint,
  requiredRatio,
  minWidth,
  sizeLabel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    // Строгая проверка размеров баннера до загрузки.
    if (requiredRatio) {
      let dims: { width: number; height: number };
      try {
        dims = await readImageSize(file);
      } catch {
        setError("Не удалось прочитать изображение");
        resetInput();
        return;
      }
      const { width, height } = dims;
      const ratio = width / height;
      // Допуск ±4% по пропорции — чтобы не придираться к 1 пикселю.
      if (Math.abs(ratio - requiredRatio) > requiredRatio * 0.04) {
        setError(
          `Баннер должен быть ${sizeLabel ?? "правильной пропорции"}. У вашего файла — ${width}×${height} px. Обрежьте до нужной пропорции и загрузите снова.`
        );
        resetInput();
        return;
      }
      if (minWidth && width < minWidth) {
        setError(
          `Баннер слишком маленький: нужна ширина от ${minWidth} px (рекомендуем ${sizeLabel ?? ""}). У вашего файла — ${width}×${height} px.`
        );
        resetInput();
        return;
      }
    }

    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Не удалось загрузить файл");
        return;
      }
      const data = await res.json();
      onChange(data.url as string);
    } catch {
      setError("Не удалось загрузить файл");
    } finally {
      setUploading(false);
      // Сбрасываем выбор, чтобы можно было выбрать тот же файл повторно.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const rounded = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div>
      <label className="mb-1.5 block text-sm text-muted">{label}</label>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center overflow-hidden border border-border bg-surface-2 ${rounded}`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted">нет</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent/60 disabled:opacity-50"
          >
            {uploading ? "Загрузка…" : value ? "Заменить" : "Загрузить картинку"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-sm text-muted transition hover:text-red-300"
            >
              Убрать
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted/60">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
    </div>
  );
}
