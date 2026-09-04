import { NextResponse } from "next/server";

/**
 * Proxy to the NestJS AI mentor status. Tells the UI whether an Anthropic key
 * is configured. On any error we report { configured: false } so the feature
 * stays hidden rather than crashing.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const STATUS_TIMEOUT_MS = 5_000;

export async function GET() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL.replace(/\/$/, "")}/mentor/status`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ configured: false });
    const data = (await res.json()) as { configured?: unknown };
    return NextResponse.json({ configured: Boolean(data?.configured) });
  } catch {
    return NextResponse.json({ configured: false });
  } finally {
    clearTimeout(timer);
  }
}
