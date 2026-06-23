"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Stars from "@/components/Stars";
import { submitReview, deleteReview } from "./actions";

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: string; // ISO
  isMine: boolean;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Reviews({
  profileId,
  targetUserId,
  canReview,
  isOwner,
  average,
  count,
  reviews,
  myReview,
}: {
  profileId: string;
  targetUserId: string;
  canReview: boolean;
  isOwner: boolean;
  average: number;
  count: number;
  reviews: ReviewItem[];
  myReview: ReviewItem | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(myReview?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (rating < 1) {
      setError("Поставьте оценку от 1 до 5");
      return;
    }
    setBusy(true);
    const res = await submitReview({
      targetUserId,
      profileId,
      rating,
      comment,
    });
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const res = await deleteReview({ targetUserId, profileId });
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setOpen(false);
    setRating(0);
    setComment("");
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="eyebrow">Отзывы</span>
          {count > 0 && (
            <span className="flex items-center gap-2">
              <Stars value={average} size={16} />
              <span className="num text-sm text-foreground">
                {average.toFixed(1)}
              </span>
              <span className="text-sm text-muted">· {count}</span>
            </span>
          )}
        </div>
        {!isOwner && canReview && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-accent/60 hover:text-accent"
          >
            {myReview ? "Изменить отзыв" : "Оставить отзыв"}
          </button>
        )}
      </div>

      {/* Подсказка, если оценить пока нельзя */}
      {!isOwner && !canReview && count === 0 && (
        <p className="mt-3 text-sm text-muted">
          Отзыв можно оставить после переписки с монтажёром.
        </p>
      )}

      {/* Список отзывов */}
      {reviews.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="panel p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">
                  {r.authorName}
                  {r.isMine && (
                    <span className="ml-2 text-xs text-accent-light">
                      ваш отзыв
                    </span>
                  )}
                </span>
                <Stars value={r.rating} size={14} />
              </div>
              {r.comment && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                  {r.comment}
                </p>
              )}
              <p className="mt-2 text-xs text-faint">{formatDate(r.createdAt)}</p>
            </li>
          ))}
        </ul>
      ) : (
        count === 0 && (
          <p className="mt-3 text-sm text-muted">Отзывов пока нет.</p>
        )
      )}

      {/* Окно «оставить/изменить отзыв» */}
      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="modal-card w-full max-w-lg p-6">
            <h2 className="font-display text-xl font-bold">
              {myReview ? "Изменить отзыв" : "Оставить отзыв"}
            </h2>

            {/* Выбор оценки */}
            <div
              className="mt-4 flex items-center gap-1"
              onMouseLeave={() => setHover(0)}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHover(i)}
                  aria-label={`${i} из 5`}
                  className="text-3xl leading-none transition"
                  style={{
                    color:
                      (hover || rating) >= i
                        ? "var(--accent-light)"
                        : "var(--border)",
                  }}
                >
                  ★
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 num text-sm text-muted">{rating}/5</span>
              )}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              placeholder="Как прошло сотрудничество? Что понравилось?"
              className="field mt-4"
            />
            {error && (
              <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="btn-accent px-6 py-2.5 disabled:opacity-50"
              >
                {busy ? "Сохраняем…" : "Сохранить"}
              </button>
              {myReview && (
                <button
                  type="button"
                  onClick={remove}
                  disabled={busy}
                  className="rounded-full border border-border px-5 py-2.5 font-medium text-muted transition hover:border-red-500/50 hover:text-red-300 disabled:opacity-50"
                >
                  Удалить
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="rounded-full border border-border px-6 py-2.5 font-medium text-muted transition hover:border-accent/60 hover:text-foreground disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
