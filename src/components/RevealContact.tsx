"use client";

import { useState } from "react";

// Кнопка "связаться": email показываем только после клика
// (чтобы адрес не висел в открытом виде для сборщиков спама).
export default function RevealContact({
  email,
  className = "inline-flex px-6 py-2.5",
}: {
  email: string;
  className?: string;
}) {
  const [shown, setShown] = useState(false);

  if (shown) {
    return (
      <a href={`mailto:${email}`} className={`btn-accent ${className}`}>
        {email}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShown(true)}
      className={`btn-accent ${className}`}
    >
      Связаться
    </button>
  );
}
