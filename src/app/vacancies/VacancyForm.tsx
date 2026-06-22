"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVacancy, updateVacancy, type VacancyInput } from "./actions";
import {
  WORK_FORMAT_OPTIONS,
  EMPLOYMENT_OPTIONS,
  PAY_PERIOD_OPTIONS,
} from "@/lib/labels";
import { SECTION_OPTIONS, GAME_OPTIONS, GAMES_SECTION } from "@/lib/taxonomy";

type Props = {
  vacancyId?: string;
  initial: {
    title: string;
    description: string;
    workFormat: string;
    employment: string;
    sections: string[];
    games: string[];
    software: string[];
    skills: string[];
    payMin: number | null;
    payMax: number | null;
    payPeriod: string;
    city: string;
    remote: boolean;
  };
};

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm text-muted">{children}</label>;
}

export default function VacancyForm({ vacancyId, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [workFormat, setWorkFormat] = useState(initial.workFormat);
  const [employment, setEmployment] = useState(initial.employment);
  const [sections, setSections] = useState<string[]>(initial.sections);
  const [games, setGames] = useState<string[]>(initial.games);
  const [software, setSoftware] = useState(initial.software.join(", "));
  const [skills, setSkills] = useState(initial.skills.join(", "));
  const [payMin, setPayMin] = useState(
    initial.payMin != null ? String(initial.payMin) : ""
  );
  const [payMax, setPayMax] = useState(
    initial.payMax != null ? String(initial.payMax) : ""
  );
  const [payPeriod, setPayPeriod] = useState(initial.payPeriod);
  const [city, setCity] = useState(initial.city);
  const [remote, setRemote] = useState(initial.remote);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggle(
    list: string[],
    setList: (v: string[]) => void,
    value: string
  ) {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const input: VacancyInput = {
      title,
      description,
      workFormat,
      employment,
      sections,
      games: sections.includes(GAMES_SECTION) ? games : [],
      software: software.split(",").map((s) => s.trim()).filter(Boolean),
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      payMin: payMin.trim() ? Number(payMin) : null,
      payMax: payMax.trim() ? Number(payMax) : null,
      payPeriod: payPeriod || null,
      city,
      remote,
    };

    const result = vacancyId
      ? await updateVacancy(vacancyId, input)
      : await createVacancy(input);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push(`/vacancies/${result.id}`);
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
        <Label>Заголовок</Label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="например, Монтажёр Shorts для YouTube-канала"
          className="field"
        />
      </div>

      <div>
        <Label>Описание</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
          placeholder="Что за проект, объём, требования, что важно"
          className="field"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Формат работы</Label>
          <select
            value={workFormat}
            onChange={(e) => setWorkFormat(e.target.value)}
            className="field"
          >
            {WORK_FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Занятость</Label>
          <select
            value={employment}
            onChange={(e) => setEmployment(e.target.value)}
            className="field"
          >
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label>Разделы / ниши (можно несколько)</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SECTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(sections, setSections, opt.value)}
              className={boxClass(sections.includes(opt.value))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {sections.includes(GAMES_SECTION) && (
        <div>
          <Label>Игры (для раздела «Игры»)</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GAME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(games, setGames, opt.value)}
                className={boxClass(games.includes(opt.value))}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label>
          Требуемый софт <span className="text-muted/60">(через запятую)</span>
        </Label>
        <input
          type="text"
          value={software}
          onChange={(e) => setSoftware(e.target.value)}
          placeholder="Premiere Pro, After Effects"
          className="field"
        />
      </div>

      <div>
        <Label>
          Требуемые навыки <span className="text-muted/60">(через запятую)</span>
        </Label>
        <input
          type="text"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="цветокор, моушн-графика, субтитры"
          className="field"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>Оплата от, ₽</Label>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
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
        <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-sm text-foreground/90">
          <input
            type="checkbox"
            checked={remote}
            onChange={(e) => setRemote(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Можно удалённо
        </label>
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
          {loading
            ? "Сохраняем…"
            : vacancyId
              ? "Сохранить"
              : "Разместить вакансию"}
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
