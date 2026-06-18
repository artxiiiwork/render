import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

// Заголовочный шрифт — Montserrat (жирное, "плакатное" начертание).
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800", "900"],
});

// Текстовый шрифт — Inter (спокойный, хорошо читаемый).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "RENDER — поиск видеомонтажёров и работы",
  description:
    "Доска вакансий и резюме для видеомонтажёров: YouTube, Shorts, Reels, TikTok. Работодатели находят монтажёров, монтажёры — работу.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
