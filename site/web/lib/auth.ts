"use client";

import { useCallback, useEffect, useState } from "react";
import { getLearningEvents, learningEventsBelongTo, mergeServerProgress, prepareLearningEventsForUser, type ProgressSnapshot } from "@/lib/progress";
import { isAnalyticsOptedOut } from "@/lib/privacy";

const AUTH_EVENT = "goroutine:auth-changed";
const syncedEventUsers = new Set<string>();

export interface AuthUser {
  id: string;
  email: string;
  level?: string;
}
export type AuthLevel = "junior" | "middle" | "senior";

export function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

function csrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie.split("; ").find((entry) => entry.startsWith("goroutine.csrf="));
  return value ? decodeURIComponent(value.slice("goroutine.csrf=".length)) : null;
}

/** Requests use HttpOnly cookies; the bearer token is never exposed to JavaScript. */
async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (auth && method !== "GET" && method !== "HEAD") {
    const csrf = csrfToken();
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }
  let res: Response;
  try {
    res = await fetch(`${apiUrl()}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new AuthError("Не удалось связаться с сервером. Проверь, что бэкенд запущен.", 0);
  }
  if (!res.ok) {
    let message = "Что-то пошло не так. Попробуй ещё раз.";
    if (res.status === 401) message = "Неверная почта или пароль.";
    else if (res.status === 429) message = "Лимит запросов исчерпан. Попробуй позже.";
    else if (res.status === 409) message = "Аккаунт с такой почтой уже существует.";
    else if (res.status === 400) message = "Проверь почту и пароль и попробуй снова.";
    try {
      const body = await res.json();
      if (body && typeof body.message === "string") message = body.message;
      else if (Array.isArray(body?.message) && body.message.length) message = body.message[0];
    } catch { /* keep default */ }
    throw new AuthError(message, res.status);
  }
  return (await res.json()) as T;
}

/** Shared API client for authenticated product surfaces beyond account sync. */
export function apiRequest<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  return request<T>(path, init, auth);
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = "AuthError"; this.status = status; }
}

export async function me(): Promise<AuthUser | null> {
  try { return await request<AuthUser>("/auth/me", { method: "GET" }); }
  catch (err) {
    if (err instanceof AuthError && (err.status === 401 || err.status === 403)) return null;
    throw err;
  }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const user = await request<{ user: AuthUser }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  await syncProgress();
  prepareLearningEventsForUser(user.user.id);
  if (await syncLearningEvents(user.user.id)) syncedEventUsers.add(user.user.id);
  window.dispatchEvent(new Event(AUTH_EVENT));
  return user.user;
}

export async function register(email: string, password: string, level?: AuthLevel): Promise<AuthUser> {
  const user = await request<{ user: AuthUser }>("/auth/register", { method: "POST", body: JSON.stringify(level ? { email, password, level } : { email, password }) });
  await syncProgress();
  prepareLearningEventsForUser(user.user.id);
  if (await syncLearningEvents(user.user.id)) syncedEventUsers.add(user.user.id);
  window.dispatchEvent(new Event(AUTH_EVENT));
  return user.user;
}

export async function logout() {
  try { await request("/auth/logout", { method: "POST" }, true); } finally { window.dispatchEvent(new Event(AUTH_EVENT)); }
}

export async function syncProgress(options: { preferLocalCode?: boolean } = {}): Promise<boolean> {
  try {
    const server = await request<Partial<ProgressSnapshot>>("/me/progress", { method: "GET" }, true);
    const merged = mergeServerProgress(server || {}, { preferServerCode: !options.preferLocalCode });
    await request("/me/progress", { method: "PUT", body: JSON.stringify({ solved: merged.solved, solvedAt: merged.solvedAt, code: merged.code }) }, true);
    return true;
  } catch {
    /* local-first experience survives a flaky backend */
    return false;
  }
}

/** Upload locally recorded learning actions in idempotent batches. */
export async function syncLearningEvents(userId?: string): Promise<boolean> {
  if (isAnalyticsOptedOut()) return false;
  if (userId && !learningEventsBelongTo(userId)) return false;
  const events = getLearningEvents();
  try {
    for (let offset = 0; offset < events.length; offset += 100) {
      await request("/me/events", { method: "POST", body: JSON.stringify({ events: events.slice(offset, offset + 100) }) }, true);
    }
    return true;
  } catch {
    // Events remain locally available and will be retried on the next session.
    return false;
  }
}

/** Redeem a short-lived grader proof for a server-side product entitlement. */
export async function confirmTaskPass(taskId: string, proof: string): Promise<void> {
  await request("/me/task-passes", { method: "POST", body: JSON.stringify({ taskId, proof }) }, true);
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const current = await me();
      setUser(current);
      if (current && !syncedEventUsers.has(current.id)) {
        prepareLearningEventsForUser(current.id);
        syncedEventUsers.add(current.id);
        void syncLearningEvents(current.id).then((ok) => { if (!ok) syncedEventUsers.delete(current.id); });
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); const sync = () => void refresh(); window.addEventListener(AUTH_EVENT, sync); return () => window.removeEventListener(AUTH_EVENT, sync); }, [refresh]);
  const doLogin = useCallback(async (email: string, password: string) => { const u = await login(email, password); setUser(u); return u; }, []);
  const doRegister = useCallback(async (email: string, password: string, level?: AuthLevel) => { const u = await register(email, password, level); setUser(u); return u; }, []);
  const doLogout = useCallback(async () => { await logout(); setUser(null); }, []);
  return { user, loading, login: doLogin, register: doRegister, logout: doLogout, refresh };
}
