"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/ds";
import { useProgress } from "@/lib/progress";
import { useAuth } from "@/lib/auth";

type NavItem = { href: string; label: string; match: string };
const GLOBAL_NAV: NavItem[] = [
  { href: "/go-basics", label: "Основы Go", match: "/go-basics" },
  { href: "/go", label: "Concurrency", match: "/go" },
  { href: "/os", label: "ОС", match: "/os" },
  { href: "/projects", label: "Проекты", match: "/projects" },
  { href: "/teams", label: "Команды", match: "/teams" },
];
const COURSE_NAV: Record<string, NavItem[]> = {
  "go-basics": [{ href: "/go-basics/book", label: "Учебник", match: "/go-basics/book" }],
  go: [{ href: "/go/tasks/01", label: "Практика", match: "/go/tasks" }, { href: "/go/book", label: "Учебник", match: "/go/book" }, { href: "/go/practice", label: "Задачи", match: "/go/practice" }, { href: "/go/skills", label: "Навыки", match: "/go/skills" }, { href: "/go/interview", label: "Интервью", match: "/go/interview" }, { href: "/projects", label: "Проекты", match: "/projects" }, { href: "/teams", label: "Команды", match: "/teams" }],
  os: [{ href: "/os", label: "Обзор", match: "/os" }, { href: "/os/labs", label: "Лаборатории", match: "/os/labs" }, { href: "/os/sim/scheduler", label: "Симулятор", match: "/os/sim" }, { href: "/projects", label: "Проекты", match: "/projects" }, { href: "/teams", label: "Команды", match: "/teams" }],
};
const TOTAL_TASKS = 32;
type CourseKey = "go-basics" | "go" | "os";
function currentCourse(pathname: string): CourseKey | null { if (pathname.startsWith("/go-basics")) return "go-basics"; if (pathname.startsWith("/go")) return "go"; if (pathname.startsWith("/os")) return "os"; return null; }

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useProgress(TOTAL_TASKS, "go");
  const { user, logout } = useAuth();
  const course = currentCourse(pathname);
  const nav = course ? COURSE_NAV[course] : GLOBAL_NAV;
  const courseName = course === "go" ? "Go / Concurrency" : course === "os" ? "Operating systems" : course === "go-basics" ? "Go basics" : null;

  const closeMenu = () => setMenuOpen(false);
  const navLink = (item: NavItem, mobile = false) => (
    <Link
      key={`${mobile ? "mobile-" : ""}${item.href}`}
      href={item.href}
      className={item.match === "/os" ? (pathname === "/os" ? "active" : "") : (pathname === item.match || pathname.startsWith(`${item.match}/`) ? "active" : "")}
      onClick={mobile ? closeMenu : undefined}
    >
      {item.label}
    </Link>
  );

  return <header className="site-header"><div className="header-inner">
    <Link href="/" className="brand" aria-label="GraphLMS" onClick={closeMenu}><Logo size={24} /></Link>
    <span className="header-divider" />
    {courseName && <Link href="/" className="course-switcher" title="Все программы" onClick={closeMenu}>{courseName}<span>⌄</span></Link>}
    <nav className="main-nav" aria-label="Основная навигация">{nav.map((item) => navLink(item))}</nav>
    <div className="header-spacer" />
    {course === "go" && <Link href="/account" className="header-progress" title="Прогресс"><span className="progress-ring" />{count}/{TOTAL_TASKS}</Link>}
    {user ? <>
      <Link href="/account" className="user-chip" title="Личный кабинет"><span>{user.email.slice(0, 1).toUpperCase()}</span><b>{user.email}</b></Link>
      <button className="logout-button" type="button" onClick={logout}>Выйти</button>
    </> : <div className="guest-actions"><Link href="/account" className="account-link">Кабинет</Link><Link href="/auth" className="login-link">Войти</Link><Link href="/go/tasks/01" className="header-cta">Начать</Link></div>}
    <button
      type="button"
      className="mobile-menu-toggle"
      aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
      aria-expanded={menuOpen}
      onClick={() => setMenuOpen((open) => !open)}
    >
      <span /><span /><span />
    </button>
  </div>
  {menuOpen && <div className="mobile-menu"><nav aria-label="Мобильная навигация">{nav.map((item) => navLink(item, true))}</nav><div className="mobile-menu-divider" /><Link href="/" onClick={closeMenu}>Все программы</Link><Link href="/account" onClick={closeMenu}>Личный кабинет</Link><Link href="/auth" onClick={closeMenu}>Войти или зарегистрироваться</Link></div>}
  </header>;
}
