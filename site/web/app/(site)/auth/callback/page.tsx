"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, Callout, Card, Logo } from "@/ds";
import { setToken, syncProgress } from "@/lib/auth";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Доступ не предоставлен. Попробуй войти ещё раз.",
  oauth_failed: "Не удалось войти через провайдера. Попробуй ещё раз.",
  default: "Не удалось завершить вход. Попробуй ещё раз.",
};

function Callback() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    const errCode = params.get("error");

    if (errCode) {
      setError(ERROR_MESSAGES[errCode] || ERROR_MESSAGES.default);
      return;
    }
    if (!token) {
      setError(ERROR_MESSAGES.default);
      return;
    }

    let cancelled = false;
    (async () => {
      setToken(token);
      // Pull server progress and merge into local, then push back.
      await syncProgress();
      if (!cancelled) router.replace("/account");
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <div
      style={{
        minHeight: "calc(100vh - var(--header-h))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px 72px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex" }}>
            <Logo size={26} />
          </Link>
        </div>

        <Card padding={28}>
          {error ? (
            <div>
              <Callout tone="danger" title="Вход не удался">
                {error}
              </Callout>
              <div style={{ marginTop: 20 }}>
                <Link href="/auth" style={{ textDecoration: "none", display: "block" }}>
                  <Button hierarchy="accent" fullWidth>
                    Вернуться ко входу
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                padding: "12px 0",
              }}
            >
              <Spinner />
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 15,
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                Входим…
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11.5,
                  color: "var(--text-tertiary)",
                  margin: 0,
                }}
              >
                // синхронизируем прогресс
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: "2.5px solid var(--border-default)",
        borderTopColor: "var(--accent)",
        display: "inline-block",
        animation: "graphlms-spin 0.7s linear infinite",
      }}
    >
      <style>{`@keyframes graphlms-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <Callback />
    </Suspense>
  );
}
