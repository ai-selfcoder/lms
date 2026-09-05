"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/ds";
import { useProgress } from "@/lib/progress";
import { useAuth } from "@/lib/auth";
import styles from "./SiteHeader.module.css";

const COURSE_NAV: Record<string, { href: string; label: string; match: string }[]> = {
  "go-basics": [{ href: "/go-basics/book", label: "Учебник", match: "/go-basics/book" }],
  go: [
    { href: "/go", label: "Обзор", match: "/go" },
    { href: "/go/topics", label: "Практика", match: "/go/topics" },
    { href: "/go/book", label: "Учебник", match: "/go/book" },
  ],
  os: [
    { href: "/os", label: "Обзор", match: "/os" },
    { href: "/os/book/process", label: "Учебник", match: "/os/book" },
    { href: "/os/sim/scheduler", label: "Симуляторы", match: "/os/sim" },
  ],
};

const TOTAL_TASKS = 32;
type CourseKey = "go-basics" | "go" | "os";

function currentCourse(pathname: string): CourseKey | null {
  if (pathname.startsWith("/go-basics")) return "go-basics";
  if (pathname.startsWith("/go")) return "go";
  if (pathname.startsWith("/os")) return "os";
  return null;
}

function courseLabel(course: CourseKey | null): string {
  if (course === "go") return "Go"
  if (course === "os") return "ОС";
  if (course === "go-basics") return "Основы";
  return "Курсы";
}

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useProgress(TOTAL_TASKS);
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const course = currentCourse(pathname);
  const nav = course ? COURSE_NAV[course] : [];

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <h1 style={{ margin: 0, padding: 0, lineHeight: 0, display: "inline-flex" }}>
          <Link className={styles.brand} href="/" title="GraphLMS — интерактивные учебники и тренажёры" aria-label="GraphLMS — на главную">
            <Logo size={22} />
          </Link>
        </h1>
        <Link className={styles.courseChip} href="/" aria-label="Вернуться к каталогу">{courseLabel(course)}</Link>
        <nav className={styles.nav} aria-label="Навигация курса">
          {nav.map((item) => {
            const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
            return <Link key={item.href} className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`} href={item.href} aria-current={active ? "page" : undefined}>{item.label}</Link>;
          })}
        </nav>
        <div className={styles.actions}>
          {course === "go" && <Link className={styles.progressLink} href="/account">{count}/{TOTAL_TASKS} решено</Link>}
          {user ? <>
            <Link className={styles.accountLink} href="/account" title={user.email} aria-label={`Аккаунт: ${user.email}`}><span className={styles.accountDot} aria-hidden="true" /><span className={styles.accountEmail}>{user.email}</span></Link>
            <button className={styles.logout} type="button" onClick={logout}>Выйти</button>
          </> : <Link className={styles.startLink} href="/go">Начать</Link>}
        </div>
        <button className={styles.menuButton} type="button" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          <span className={styles.menuIcon} aria-hidden="true" />
        </button>
      </div>
      {menuOpen && <nav id="mobile-navigation" className={styles.mobileMenu} aria-label="Мобильная навигация">
        <div className={styles.mobileSection}>Навигация</div>
        {course && nav.map((item) => {
          const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
          return <Link key={item.href} className={`${styles.mobileLink} ${active ? styles.mobileLinkActive : ""}`} href={item.href} aria-current={active ? "page" : undefined}>{item.label}</Link>;
        })}
        <Link className={styles.mobileLink} href="/">Все курсы</Link>
        <Link className={styles.mobileLink} href="/account">Прогресс {course === "go" ? `(${count}/${TOTAL_TASKS})` : ""}</Link>
        <div className={styles.mobileDivider} />
        {user ? <button className={styles.mobileLink} type="button" onClick={logout}>Выйти</button> : <Link className={styles.mobileLink} href="/go">Начать обучение</Link>}
      </nav>}
    </header>
  );
}
