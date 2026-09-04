"use client";

import { useCallback, useEffect, useState } from "react";
import { mergeServerProgress, type ProgressSnapshot } from "@/lib/progress";

/**
 * Client-side auth against the NestJS backend.
 * The JWT lives in localStorage under `goroutine.token`. A custom event keeps
 * the header and account view in sync (same pattern as lib/progress).
 */

const TOKEN_KEY = "goroutine.token";
const AUTH_EVENT = "goroutine:auth-changed";

export interface AuthUser {
  id: string;
  email: string;
  level?: string;
}

export type AuthLevel = "junior" | "middle" | "senior";

/** API base URL. Falls back to localhost when the env var is missing. */
export function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event(AUTH_EVENT));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
  } catch {
    /* ignore */
  }
}

/** Thrown for non-2xx API responses; carries a Russian, user-facing message. */
export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${apiUrl()}${path}`, { ...init, headers });
  } catch {
    // Network failure — backend unreachable. Don't crash the UI.
    throw new AuthError(
      "Не удалось связаться с сервером. Проверь, что бэкенд запущен.",
      0
    );
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
    } catch {
      /* keep default message */
    }
    throw new AuthError(message, res.status);
  }

  return (await res.json()) as T;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

/** GET /auth/me — current user for the stored token, or null when none. */
export async function me(): Promise<AuthUser | null> {
  if (!getToken()) return null;
  try {
    return await request<AuthUser>("/auth/me", { method: "GET" }, true);
  } catch (err) {
    // Expired / invalid token → drop it so the UI shows logged-out state.
    if (err instanceof AuthError && (err.status === 401 || err.status === 403)) {
      clearToken();
      return null;
    }
    throw err;
  }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(res.accessToken);
  await syncProgress();
  return res.user;
}

export async function register(
  email: string,
  password: string,
  level?: AuthLevel
): Promise<AuthUser> {
  const res = await request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(level ? { email, password, level } : { email, password }),
  });
  setToken(res.accessToken);
  await syncProgress();
  return res.user;
}

export function logout() {
  clearToken();
}

/**
 * Two-way progress sync. Pulls the server snapshot, merges it into local
 * (union solved, earliest solvedAt, server-wins code), then pushes the merged
 * result back. No-op when logged out. Swallows errors so a flaky backend never
 * breaks the local-first experience.
 */
export async function syncProgress(): Promise<void> {
  if (!getToken()) return;
  try {
    const server = await request<Partial<ProgressSnapshot>>(
      "/me/progress",
      { method: "GET" },
      true
    );
    const merged = mergeServerProgress(server || {});
    await request<unknown>(
      "/me/progress",
      {
        method: "PUT",
        body: JSON.stringify({
          solved: merged.solved,
          solvedAt: merged.solvedAt,
          code: merged.code,
        }),
      },
      true
    );
  } catch {
    // Stay local-first on any failure.
  }
}

/**
 * Reactive auth hook. `user` is resolved from /auth/me when a token exists,
 * else null. Re-resolves on the auth-changed event and on cross-tab storage
 * changes, so header/account update live.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setUser(await me());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const sync = () => void refresh();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [refresh]);

  const doLogin = useCallback(
    async (email: string, password: string) => {
      const u = await login(email, password);
      setUser(u);
      return u;
    },
    []
  );

  const doRegister = useCallback(
    async (email: string, password: string, level?: AuthLevel) => {
      const u = await register(email, password, level);
      setUser(u);
      return u;
    },
    []
  );

  const doLogout = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    login: doLogin,
    register: doRegister,
    logout: doLogout,
    refresh,
  };
}
