import { NextResponse } from "next/server";

/**
 * Proxy to the Go grader. The browser never talks to the grader directly.
 * POST /api/run         → enqueue a grade, returns { jobId }.
 * GET  /api/run?id=...  → poll job status { status, position, queueLength, result? }.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRADER_URL = process.env.GRADER_URL ?? "http://localhost:8090";
const MAX_CODE_BYTES = 256 * 1024; // 256 KB guard
const FETCH_TIMEOUT_MS = 10_000;

interface RunRequest {
  taskId?: string;
  course?: string;
  code?: string;
}

function graderBase() {
  return GRADER_URL.replace(/\/$/, "");
}

function errorResponse(message: string, status = 502) {
  return NextResponse.json({ error: true, message }, { status });
}

export async function POST(req: Request) {
  let body: RunRequest;
  try {
    body = (await req.json()) as RunRequest;
  } catch {
    return errorResponse("Некорректный JSON в запросе.", 400);
  }

  const { taskId, course, code } = body;
  if (!taskId || typeof taskId !== "string") {
    return errorResponse("Отсутствует taskId.", 400);
  }
  const courseId = typeof course === "string" && course.length > 0 ? course : "go";
  if (typeof code !== "string" || code.trim().length === 0) {
    return errorResponse("Пустой код решения.", 400);
  }
  if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
    return errorResponse("Код слишком большой.", 413);
  }

  const xff = req.headers.get("x-forwarded-for") ?? "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${graderBase()}/api/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(xff ? { "X-Forwarded-For": xff } : {}),
      },
      body: JSON.stringify({ taskId, course: courseId, code }),
      signal: controller.signal,
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      jobId?: string;
      error?: string;
    };
    if (!res.ok) {
      return NextResponse.json(
        { error: true, message: data?.error ?? `Грейдер вернул ошибку ${res.status}.` },
        { status: res.status }
      );
    }
    return NextResponse.json({ jobId: data.jobId });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return errorResponse(
      aborted
        ? "Грейдер не ответил вовремя. Попробуйте ещё раз."
        : "Не удалось связаться с грейдером.",
      aborted ? 504 : 502
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return errorResponse("Отсутствует id.", 400);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${graderBase()}/api/run?id=${encodeURIComponent(id)}`,
      { cache: "no-store", signal: controller.signal }
    );
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 404) {
      // Treat an expired/unknown job as a soft error the client can render.
      return NextResponse.json({
        status: "error",
        message: "Задача истекла — запусти заново.",
      });
    }
    if (!res.ok) {
      return errorResponse(
        (data?.error as string) ?? `Грейдер вернул ошибку ${res.status}.`,
        502
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return errorResponse(
      aborted ? "Грейдер не ответил вовремя." : "Не удалось связаться с грейдером.",
      aborted ? 504 : 502
    );
  } finally {
    clearTimeout(timer);
  }
}
