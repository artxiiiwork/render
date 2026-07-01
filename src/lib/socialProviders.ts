// Какие способы входа через соцсети включены — определяем по наличию ключей
// в окружении. Лёгкий серверный модуль (без next-auth/prisma), чтобы серверные
// страницы могли передать список кнопок в клиентский компонент.

export type SocialProvider = "yandex" | "vk";

export const SOCIAL_LABELS: Record<SocialProvider, string> = {
  yandex: "Яндекс ID",
  vk: "ВКонтакте",
};

export function enabledSocialProviders(): SocialProvider[] {
  const list: SocialProvider[] = [];
  if (process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET) {
    list.push("yandex");
  }
  if (process.env.VK_CLIENT_ID && process.env.VK_CLIENT_SECRET) {
    list.push("vk");
  }
  return list;
}
