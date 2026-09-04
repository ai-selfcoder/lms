/**
 * SEO helpers shared across the app. Single source of truth for the public
 * base URL (canonicals, sitemap, OpenGraph, JSON-LD) and small builders for
 * structured-data graphs. Server-safe — no client-only APIs.
 *
 * The production domain is injected at deploy time via `SITE_URL`
 * (`PUBLIC_WEB_URL` in the compose stack); we fall back to a local placeholder.
 */

export const SITE_URL = (process.env.SITE_URL ?? "https://goconcurrency.local").replace(/\/+$/, "");

export const SITE_NAME = "GraphLMS";
export const SITE_TAGLINE = "Интерактивные учебники и тренажёры для инженеров";

/** Absolute URL for a site-relative path (e.g. `/go/book`). */
export function absUrl(pathname: string): string {
  if (!pathname || pathname === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

/**
 * Organisation node reused across pages. Modelled as an EducationalOrganization
 * so search engines understand this is a learning platform, not a blog.
 */
export function organizationLd() {
  return {
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_TAGLINE,
    logo: absUrl("/icon.svg"),
  };
}

/** WebSite node — enables sitelinks search box and ties pages to the brand. */
export function websiteLd() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    inLanguage: "ru-RU",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}
