// Служебная "дверь" для входа/выхода — Auth.js сам обрабатывает эти запросы.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
