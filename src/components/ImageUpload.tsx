"use client";

import { useRef, useState } from "react";

type Props = {
  label: string;
  value: string; // текущая ссылка на картинку ("" если нет)
  onChange: (url: string) => void;
  shape?: "circle" | "square";
  hint?: string;
};

// Выбор картинки с компьютера: загружает файл и отдаёт ссылку наверх.
export default function ImageUpload({
  label,
  value,
  onChange,
  shape = "circle",
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
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
