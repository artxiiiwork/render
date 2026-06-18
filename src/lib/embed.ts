// Превращаем ссылку на YouTube/Vimeo в адрес для встраивания (iframe).
// Если ссылку не распознали — вернём null (покажем просто ссылкой).
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    // YouTube: короткая ссылка youtu.be/<id>
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // YouTube: youtube.com/watch?v=<id>, /shorts/<id>, /embed/<id>
    if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const m = u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
    }

    // Vimeo: vimeo.com/<id>
    if (host.endsWith("vimeo.com")) {
      const m = u.pathname.match(/\/(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}`;
    }

    return null;
  } catch {
    return null;
  }
}
