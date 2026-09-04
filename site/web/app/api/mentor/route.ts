import { NextResponse } from "next/server";

/**
 * Proxy to the NestJS AI mentor. The Anthropic key stays server-side; the
 * browser never talks to the API directly. We forward the review body and
 * return the structured verdict. On unreachable / 5xx we return a clear JSON
 * error (never crash).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const MENTOR_TIMEOUT_MS = 90_000;

function errorResponse(message: string, status = 503) {
  return NextResponse.json({ error: true, message }, { status });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Некорректный JSON в запросе.", 400);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MENTOR_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL.replace(/\/$/, "")}/mentor/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const raw =
        data && typeof data === "object"
          ? (data as { message?: unknown }).message
          : undefined;
      const message =
        typeof raw === "string" && raw.length > 0
          ? raw
          : "AI-ментор сейчас недоступен. Попробуй позже.";
      return errorResponse(message, res.status >= 500 ? 503 : res.status);
    }

    return NextResponse.json(data ?? {});
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return errorResponse(
      aborted
        ? "AI-ментор не ответил вовремя. Попробуй ещё раз."
        : `Не удалось связаться с AI-ментором по адресу ${API_URL}.`,
      503
    );
  } finally {
    clearTimeout(timer);
  }
}
