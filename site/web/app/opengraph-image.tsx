import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Динамический OG-баннер GraphLMS (1200×630). Брендовые токены — из дизайн-системы:
// accent #276EF1, canvas #0b0d10, шрифт Geist (с кириллицей).
export const runtime = "nodejs";
export const alt = "GraphLMS — учебник и тренажёр по Go";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ACCENT = "#276EF1";
const CANVAS = "#0b0d10";

const fontPath = (file: string) =>
  join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans", file);

export default async function OpengraphImage() {
  const [regular, semibold, bold] = await Promise.all([
    readFile(fontPath("Geist-Regular.ttf")),
    readFile(fontPath("Geist-SemiBold.ttf")),
    readFile(fontPath("Geist-Bold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CANVAS,
          backgroundImage: `radial-gradient(900px 500px at 8% -10%, rgba(39,110,241,0.22), rgba(39,110,241,0))`,
          padding: "72px 80px",
          fontFamily: "Geist",
          color: "#fff",
        }}
      >
        {/* Лого-локап */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill={ACCENT} />
            <path
              d="M8.5 9.5 14 14m0 0 5.5-4.5M14 14v5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="8.5" cy="9.5" r="2" fill="#fff" />
            <circle cx="19.5" cy="9.5" r="2" fill="#fff" />
            <circle cx="14" cy="19" r="2" fill="#fff" />
          </svg>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em" }}>
            <span>Graph</span>
            <span style={{ color: ACCENT }}>LMS</span>
          </div>
        </div>

        {/* Заголовок */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 920,
            }}
          >
            Учебник и тренажёр по конкурентности Go
          </div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 400, color: "#9aa3af" }}>
            Читай&nbsp;→&nbsp;решай&nbsp;→&nbsp;прогоняй&nbsp;→&nbsp;разбирай
          </div>
        </div>

        {/* Нижняя плашка */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: "#6b7280" }}>
          <div style={{ display: "flex", width: 28, height: 4, borderRadius: 2, background: ACCENT }} />
          <span>go&nbsp;test&nbsp;-race&nbsp;·&nbsp;собеседования middle–senior</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist", data: semibold, weight: 600, style: "normal" },
        { name: "Geist", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
