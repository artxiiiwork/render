"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveEditorProfile } from "./actions";
import ImageUpload from "@/components/ImageUpload";
import {
  FORMAT_OPTIONS,
  WORK_FORMAT_OPTIONS,
  PAY_PERIOD_OPTIONS,
  EDITOR_STATUS_OPTIONS,
} from "@/lib/labels";

type Props = {
  initial: {
    headline: string;
    bio: string;
    avatarUrl: string;
    coverUrl: string;
    skills: string[];
    software: string[];
    formats: string[];
    languages: string[];
    experienceYears: number | null;
    workFormats: string[];
    payMin: number | null;
    payMax: number | null;
    payPeriod: string;
    city: string;
    remote: boolean;
    status: string;
    portfolio: { url: string; title: string }[];
  };
};

// Подпись над группой полей.
function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm text-muted">{children}</label>;
}

export default function EditEditorForm({ initial }: Props) {
  const router = useRouter();
  const [headline, setHeadline] = useState(initial.headline);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl);
  const [skills, setSkills] = useState(initial.skills.join(", "));
  const [software, setSoftware] = useState(initial.software.join(", "));
  const [formats, setFormats] = useState<string[]>(initial.formats);
  const [languages, setLanguages] = useState(initial.languages.join(", "));
  const [experience, setExperience] = useState(
    initial.experienceYears != null ? String(initial.experienceYears) : ""
  );
  const [workFormats, setWorkFormats] = useState<string[]>(initial.workFormats);
  const [payMin, setPayMin] = useState(
    initial.payMin != null ? String(initial.payMin) : ""
  );
  const [payMax, setPayMax] = useState(
    initial.payMax != null ? String(initial.payMax) : ""
  );
  const [payPeriod, setPayPeriod] = useState(initial.payPeriod);
  const [city, setCity] = useState(initial.city);
  const [remote, setRemote] = useState(initial.remote);
  const [status, setStatus] = useState(initial.status);
  const [portfolio, setPortfolio] = useState<{ url: string; title: string }[]>(
    initial.portfolio.length ? initial.portfolio : [{ url: "", title: "" }]
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    );
  }

  function updatePortfolio(i: number, field: "url" | "title", value: string) {
    setPortfolio((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await saveEditorProfile({
      headline,
      bio,
      avatarUrl,
      coverUrl,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      software: software.split(",").map((s) => s.trim()).filter(Boolean),
      formats,
      languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
      experienceYears: experience.trim() ? Number(experience) : null,
      workFormats,
      payMin: payMin.trim() ? Number(payMin) : null,
      payMax: payMax.trim() ? Number(payMax) : null,
      payPeriod: payPeriod || null,
      city,
      remote,
      status,
      portfolio,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const boxClass = (active: boolean) =>
    `cursor-pointer rounded-xl border px-3 py-2 text-sm transition ${
      active
        ? "border-accent bg-accent/15 text-foreground"
        : "border-border text-muted hover:border-accent/50"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Заголовок / специализация</Label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          required
          placeholder="например, Монтажёр Shorts и Reels"
          className="field"
        />
      </div>

      <div>
        <Label>О себе</Label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Опыт, стиль монтажа, любимые проекты"
          className="field"
        />
      </div>

      <div>
        <Label>Специализация — форматы (можно несколько)</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(formats, setFormats, opt.value)}
              className={boxClass(formats.includes(opt.value))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>
          Софт <span className="text-muted/60">(через запятую)</span>
        </Label>
        <input
          type="text"
          value={software}
          onChange={(e) => setSoftware(e.target.value)}
          placeholder="Premiere Pro, After Effects, DaVinci Resolve, CapCut"
          className="field"
        />
      </div>

      <div>
        <Label>
          Навыки <span className="text-muted/60">(через запятую)</span>
        </Label>
        <input
          type="text"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="цветокор, моушн-графика, субтитры, звук"
          className="field"
        />
      </div>

      <div>
        <Label>
          Языки <span className="text-muted/60">(через запятую)</span>
        </Label>
        <input
          type="text"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          placeholder="русский, английский"
          className="field"
        />
      </div>

      <div>
        <Label>Формат работы (можно несколько)</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {WORK_FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(workFormats, setWorkFormats, opt.value)}
              className={boxClass(workFormats.includes(opt.value))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>Ставка/зарплата от, ₽</Label>
          <input
            type="number"
            min={0}
            value={payMin}
            onChange={(e) => setPayMin(e.target.value)}
            placeholder="от"
            className="field"
          />
        </div>
        <div>
          <Label>до, ₽</Label>
          <input
            type="number"
            min={0}
            value={payMax}
            onChange={(e) => setPayMax(e.target.value)}
            placeholder="до"
            className="field"
          />
        </div>
        <div>
          <Label>Период</Label>
          <select
            value={payPeriod}
            onChange={(e) => setPayPeriod(e.target.value)}
            className="field"
          >
            <option value="">—</option>
            {PAY_PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>Опыт, лет</Label>
          <input
            type="number"
            min={0}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="например, 3"
            className="field"
          />
        </div>
        <div>
          <Label>Город</Label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="например, Москва"
            className="field"
          />
        </div>
        <div>
          <Label>Доступность</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="field"
          >
            {EDITOR_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/90">
        <input
          type="checkbox"
          checked={remote}
          onChange={(e) => setRemote(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Готов работать удалённо
      </label>

      <ImageUpload
        label="Аватар"
        shape="circle"
        value={avatarUrl}
        onChange={setAvatarUrl}
        hint="JPG, PNG, WEBP или GIF, до 5 МБ"
      />

      <ImageUpload
        label="Обложка профиля"
        shape="square"
        value={coverUrl}
        onChange={setCoverUrl}
        hint="Широкое фото-шапка сверху резюме. Лучше горизонтальное, до 5 МБ"
      />

      <div>
        <Label>
          Шоурил и портфолио{" "}
          <span className="text-muted/60">(ссылки на YouTube / Vimeo)</span>
        </Label>
        <div className="space-y-3">
          {portfolio.map((row, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1 space-y-2">
                <input
                  type="url"
                  value={row.url}
                  onChange={(e) => updatePortfolio(index, "url", e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="field"
                />
                <input
                  type="text"
                  value={row.title}
                  onChange={(e) =>
                    updatePortfolio(index, "title", e.target.value)
                  }
                  placeholder="Подпись (необязательно)"
                  className="field"
                />
              </div>
              {portfolio.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setPortfolio((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="self-start rounded-lg border border-border px-3 py-2 text-sm text-muted hover:border-red-400/60 hover:text-red-300"
                  aria-label="Удалить ссылку"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setPortfolio((prev) => [...prev, { url: "", title: "" }])
          }
          className="mt-3 text-sm font-medium text-accent hover:underline"
        >
          + Добавить ещё ссылку
        </button>
      </div>

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
