import Link from "next/link";

export default function NotFound() {
  const btn = (accent: boolean): React.CSSProperties => ({
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    padding: "0 20px",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--font-sans)",
    fontSize: 15,
    fontWeight: 500,
    border: accent ? "var(--border-width) solid transparent" : "var(--border-width) solid var(--border-strong)",
    background: accent ? "var(--accent)" : "transparent",
    color: accent ? "var(--accent-fg)" : "var(--text-primary)",
  });

  return (
    <div
      style={{
        display: "flex",
        minHeight: "70vh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        textAlign: "center",
        background: "var(--bg-canvas)",
        padding: "0 28px",
      }}
    >
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, letterSpacing: ".02em", color: "var(--text-tertiary)" }}>
        ~/graphlms $ <b style={{ color: "var(--accent-text)", fontWeight: 500 }}>cat ./not-found</b>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 88,
          lineHeight: 1,
          fontWeight: 600,
          letterSpacing: "-.03em",
          color: "var(--text-primary)",
        }}
      >
        404
      </div>
      <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 24, fontWeight: 600, letterSpacing: "-.018em", color: "var(--text-primary)", margin: 0 }}>
        Страница не найдена
      </h1>
      <p style={{ fontSize: 15, lineHeight: "24px", color: "var(--text-secondary)", maxWidth: 420, margin: 0 }}>
        Такой задачи, главы или топика нет. Возможно, контент ещё генерируется.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <Link href="/" style={btn(true)}>
          Все курсы
        </Link>
        <Link href="/go/topics" style={btn(false)}>
          К топикам Go
        </Link>
      </div>
    </div>
  );
}
