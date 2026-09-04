"use client";

import { useCallback, useEffect, useState } from "react";
import { mergeServerProgress, type ProgressSnapshot } from "@/lib/progress";

const AUTH_EVENT = "goroutine:auth-changed";

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
  window.dispatchEvent(new Event(AUTH_EVENT));
  return user.user;
}

export async function register(email: string, password: string, level?: AuthLevel): Promise<AuthUser> {
  const user = await request<{ user: AuthUser }>("/auth/register", { method: "POST", body: JSON.stringify(level ? { email, password, level } : { email, password }) });
  await syncProgress();
  window.dispatchEvent(new Event(AUTH_EVENT));
  return user.user;
}

export async function logout() {
  try { await request("/auth/logout", { method: "POST" }, true); } finally { window.dispatchEvent(new Event(AUTH_EVENT)); }
}

export async function syncProgress(): Promise<void> {
  try {
    const server = await request<Partial<ProgressSnapshot>>("/me/progress", { method: "GET" }, true);
    const merged = mergeServerProgress(server || {});
    await request("/me/progress", { method: "PUT", body: JSON.stringify({ solved: merged.solved, solvedAt: merged.solvedAt, code: merged.code }) }, true);
  } catch { /* local-first experience survives a flaky backend */ }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setLoading(true); try { setUser(await me()); } catch { setUser(null); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); const sync = () => void refresh(); window.addEventListener(AUTH_EVENT, sync); return () => window.removeEventListener(AUTH_EVENT, sync); }, [refresh]);
  const doLogin = useCallback(async (email: string, password: string) => { const u = await login(email, password); setUser(u); return u; }, []);
  const doRegister = useCallback(async (email: string, password: string, level?: AuthLevel) => { const u = await register(email, password, level); setUser(u); return u; }, []);
  const doLogout = useCallback(async () => { await logout(); setUser(null); }, []);
  return { user, loading, login: doLogin, register: doRegister, logout: doLogout, refresh };
}
