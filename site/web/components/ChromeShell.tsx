import { SiteHeader } from "@/components/SiteHeader";
import { Logo } from "@/ds";

/**
 * Standard page chrome: sticky course-aware header + footer around the content.
 * Shared by the catalog/account layout and each course's reading pages. The
 * full-screen task IDE deliberately does NOT use this (it renders its own
 * header), so task routes live under a separate "bare" layout.
 */
export function ChromeShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        background: "var(--bg-canvas)",
      }}
    >
      <SiteHeader />
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{ borderTop: "var(--border-width) solid var(--border-subtle)" }}>
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "32px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <Logo size={20} color="var(--text-secondary)" mark="var(--text-tertiary)" />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-tertiary)",
            }}
          >
            // интерактивные учебники для инженеров · Go · ОС
          </span>
        </div>
      </footer>
    </div>
  );
}

export default ChromeShell;
