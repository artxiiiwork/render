// Работа со ссылками на ролики: встраивание (iframe) и обложка-превью.

// Извлекаем ID ролика YouTube из ссылки (watch / youtu.be / shorts / embed).
function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1) || null;
    if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)/);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

// Превращаем ссылку на YouTube/Vimeo в адрес для встраивания (iframe).
// Если ссылку не распознали — вернём null (покажем просто ссылкой).
export function toEmbedUrl(url: string): string | null {
  const yt = youtubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}`;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host.endsWith("vimeo.com")) {
      const m = u.pathname.match(/\/(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}`;
    }
  } catch {
    // невалидная ссылка — игнорируем
  }
  return null;
}

// Канонический ключ ролика для дедупликации. Одинаковые ролики, записанные
// разными формами ссылки (youtu.be, watch?v=, embed/…), дают один ключ.
export function videoKey(url: string): string {
  const yt = youtubeId(url);
  if (yt) return `yt:${yt}`;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host.endsWith("vimeo.com")) {
      const m = u.pathname.match(/\/(\d+)/);
      if (m) return `vimeo:${m[1]}`;
    }
    // Прочее — нормализуем: хост + путь без хвостового слэша (без query/хэша).
    return `url:${host}${u.pathname.replace(/\/$/, "")}`.toLowerCase();
  } catch {
    return `raw:${url.trim().toLowerCase()}`;
  }
}

// Обложка-превью ролика для карточек каталога и лендинга. Пока только YouTube —
// у него стабильные предсказуемые адреса превью. Для остального вернём null
// (карточка покажет аккуратную заглушку).
export function toThumbUrl(url: string): string | null {
  const yt = youtubeId(url);
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null;
}
