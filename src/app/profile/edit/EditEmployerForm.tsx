"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveEmployerProfile } from "./actions";
import ImageUpload from "@/components/ImageUpload";
import { EMPLOYER_TYPE_OPTIONS } from "@/lib/labels";

type Props = {
  initial: {
    displayName: string;
    type: string;
    description: string;
    channelUrl: string;
    logoUrl: string;
  };
};

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm text-muted">{children}</label>;
}

export default function EditEmployerForm({ initial }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [type, setType] = useState(initial.type);
  const [description, setDescription] = useState(initial.description);
  const [channelUrl, setChannelUrl] = useState(initial.channelUrl);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await saveEmployerProfile({
      displayName,
      type,
      description,
      channelUrl,
      logoUrl,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Название или имя</Label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          placeholder="например, Студия Громкий Кадр"
          className="field"
        />
      </div>

      <div>
        <Label>Тип</Label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="field"
        >
          {EMPLOYER_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Описание</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Чем занимаетесь, какой контент, что ищете"
          className="field"
        />
      </div>

      <div>
        <Label>
          Ссылка на канал или сайт{" "}
          <span className="text-muted/60">(необязательно)</span>
        </Label>
        <input
          type="url"
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          placeholder="https://youtube.com/@..."
          className="field"
        />
      </div>

      <ImageUpload
        label="Логотип"
        shape="square"
        value={logoUrl}
        onChange={setLogoUrl}
        hint="JPG, PNG, WEBP или GIF, до 5 МБ"
      />

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-accent px-6 py-2.5 disabled:opacity-50"
        >
          {loading ? "Сохраняем…" : "Сохранить"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="rounded-full border border-border px-6 py-2.5 font-medium text-muted transition hover:border-accent/60 hover:text-foreground"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
