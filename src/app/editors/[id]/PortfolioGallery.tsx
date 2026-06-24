"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddPortfolioCard from "./AddPortfolioCard";
import { SECTION_OPTIONS } from "@/lib/taxonomy";
import {
  updatePortfolioLink,
  deletePortfolioLink,
  reorderPortfolio,
} from "./actions";

type Item = {
  id: string;
  url: string;
  title: string | null;
  embed: string | null;
  section: string | null;
};

const NO_SECTION = "__none__";

export default function PortfolioGallery({
  items,
  isOwner,
}: {
  items: Item[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [list, setList] = useState<Item[]>(items);
  // Когда сервер пришлёт обновлённые данные (после добавления/удаления/
  // перетаскивания + router.refresh) — синхронизируемся. Это рекомендованный
  // React способ «подстроить состояние под изменившийся проп» прямо при
  // рендере, без эффекта: сравниваем ссылку на массив с предыдущей.
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setList(items);
  }

  // Перетаскивание.
  const [dragId, setDragId] = useState<string | null>(null);

  // Окно редактирования.
  const [editId, setEditId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [editSection, setEditSection] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Табы по разделам: показываем только непустые + «Прочее» для роликов без
  // раздела. Заказчик сразу видит нужный срез (ищет SAMP — видит SAMP-работы).
  const tabs = [
    ...SECTION_OPTIONS.filter((o) => list.some((it) => it.section === o.value)).map(
      (o) => ({ value: o.value, label: o.label })
    ),
    ...(list.some((it) => !it.section)
      ? [{ value: NO_SECTION, label: "Прочее" }]
      : []),
  ];
  const showTabs = tabs.length > 1;
  const [activeTab, setActiveTab] = useState("");
  const effectiveTab = showTabs
    ? tabs.some((t) => t.value === activeTab)
      ? activeTab
      : tabs[0].value
    : "";
  const visible = showTabs
    ? list.filter((it) =>
        effectiveTab === NO_SECTION ? !it.section : it.section === effectiveTab
      )
    : list;
  // Новый ролик по умолчанию — в активный раздел (если это не «Прочее»).
  const addDefault =
    effectiveTab && effectiveTab !== NO_SECTION ? effectiveTab : "";

  function handleDragEnter(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setList((prev) => {
      const from = prev.findIndex((i) => i.id === dragId);
      const to = prev.findIndex((i) => i.id === targetId);
      if (from < 0 || to < 0) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  async function persistOrder(ordered: Item[]) {
    await reorderPortfolio(ordered.map((i) => i.id));
    router.refresh();
  }

  function handleDragEnd() {
    setDragId(null);
    setList((prev) => {
      persistOrder(prev);
      return prev;
    });
  }

  function openEdit(it: Item) {
    setEditId(it.id);
    setUrl(it.url);
    setTitle(it.title ?? "");
    setEditSection(it.section ?? "");
    setError("");
  }

  async function saveEdit() {
    if (!editId) return;
    setError("");
    setBusy(true);
    const res = await updatePortfolioLink({
      id: editId,
      url,
      title,
      section: editSection || null,
    });
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setEditId(null);
    router.refresh();
  }

  async function removeLink() {
    if (!editId) return;
    setBusy(true);
    const res = await deletePortfolioLink(editId);
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setEditId(null);
    router.refresh();
  }

  if (list.length === 0 && !isOwner) {
    return (
      <p className="mt-3 text-sm text-muted">
        Монтажёр пока не добавил ролики.
      </p>
    );
  }

  return (
    <>
      {/* Табы по разделам */}
      {showTabs && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setActiveTab(t.value)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                effectiveTab === t.value
                  ? "border-accent bg-accent/15 text-foreground"
                  : "border-border text-muted hover:border-accent/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {isOwner && list.length > 1 && (
        <p className="mt-3 text-xs text-muted/70">
          Перетаскивайте ролики мышью, чтобы поменять порядок. Наведите на ролик
          и нажмите карандаш, чтобы изменить раздел или ссылку.
        </p>
      )}

      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((it) => (
          <div
            key={it.id}
            draggable={isOwner}
            onDragStart={(e) => {
              if (!isOwner) return;
              setDragId(it.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnter={() => isOwner && handleDragEnter(it.id)}
            onDragOver={(e) => isOwner && e.preventDefault()}
            onDragEnd={handleDragEnd}
            className={`group relative overflow-hidden rounded-2xl border bg-surface-2 transition ${
              dragId === it.id
                ? "border-accent opacity-60"
                : "border-border"
            }`}
          >
            <div className="relative">
              {it.embed ? (
                <iframe
                  src={it.embed}
                  title={it.title || "Видео"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className={`aspect-video w-full ${
                    isOwner ? "pointer-events-none" : ""
                  }`}
                />
              ) : (
                <a
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex aspect-video w-full items-center justify-center break-all p-4 text-sm text-accent hover:underline"
                >
                  {it.url}
                </a>
              )}

              {/* Поверхность для перетаскивания + кнопки управления (только владелец) */}
              {isOwner && (
                <>
                  <div className="absolute inset-0 cursor-move" />
                  <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 text-xs text-white/85">
                    ⠿ перетащить
                  </span>
                  <button
                    type="button"
                    onClick={() => openEdit(it)}
                    aria-label="Редактировать ролик"
                    className="absolute right-2 top-2 rounded-md bg-black/55 px-2 py-1 text-sm text-white/90 transition hover:bg-black/80"
                  >
                    ✎
                  </button>
                </>
              )}
            </div>

            {it.title && (
              <p className="px-4 py-3 text-sm text-foreground/90">{it.title}</p>
            )}
          </div>
        ))}

        {/* Владельцу — карточка добавления нового ролика */}
        {isOwner && <AddPortfolioCard defaultSection={addDefault} />}
      </div>

      {/* Окно редактирования ролика */}
      {editId && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setEditId(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="modal-card w-full max-w-lg p-6">
            <h2 className="font-display text-xl font-bold">Изменить ролик</h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-muted">
                  Ссылка на ролик{" "}
                  <span className="text-muted/60">(YouTube / Vimeo)</span>
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Раздел</label>
                <select
                  value={editSection}
                  onChange={(e) => setEditSection(e.target.value)}
                  className="field"
                >
                  <option value="">Без раздела</option>
                  {SECTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">
                  Описание <span className="text-muted/60">(необязательно)</span>
                </label>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  rows={3}
                  placeholder="Коротко о ролике: что монтировал, стиль, роль"
                  className="field"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={busy}
                  className="btn-accent px-6 py-2.5 disabled:opacity-50"
                >
                  {busy ? "Сохраняем…" : "Сохранить"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  disabled={busy}
                  className="rounded-full border border-border px-6 py-2.5 font-medium text-muted transition hover:border-accent/60 hover:text-foreground disabled:opacity-50"
                >
                  Отмена
                </button>
              </div>
              <button
                type="button"
                onClick={removeLink}
                disabled={busy}
                className="rounded-full border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
