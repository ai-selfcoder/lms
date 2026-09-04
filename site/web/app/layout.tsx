import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@/components/Analytics";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "@/ds/styles.css";
import "./globals.css";

const TITLE = "GraphLMS — учебник и тренажёр по Go (Golang) и операционным системам";
const DESCRIPTION =
  "Бесплатный интерактивный учебник и тренажёр по Go (Golang): конкурентность, горутины, каналы, sync, context — с практикой и прогоном через go test -race. Плюс курс по операционным системам с симуляторами. Читай → решай → прогоняй → разбирай.";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: "%s · GraphLMS",
  },
  description: DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  keywords: [
    "Go",
    "Golang",
    "учебник по Go",
    "курсы по Go",
    "Go для начинающих",
    "конкурентность в Go",
    "горутины",
    "каналы Go",
    "sync",
    "context",
    "go test -race",
    "тренажёр по программированию",
    "задачи по Go",
    "подготовка к собеседованию Go",
    "операционные системы",
    "OSTEP",
    "бесплатные курсы программирования",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
