"use client";

import { useEffect, useMemo, useRef } from "react";
import { syncProgress, useAuth } from "@/lib/auth";
import { useLocalProgress } from "@/lib/progress";

/**
 * Pushes local drafts and completions after a short idle period. The API merge
 * is append-only, so a second tab or an offline retry cannot erase progress.
 */
export function ProgressSync() {
  const { user } = useAuth();
  const snapshot = useLocalProgress();
  const signature = useMemo(() => JSON.stringify(snapshot), [snapshot]);
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !signature) return;
    const key = `${user.id}:${signature}`;
    if (lastSynced.current === key) return;

    let cancelled = false;
    let retry: number | undefined;
    const run = async () => {
      const ok = await syncProgress({ preferLocalCode: true });
      if (cancelled) return;
      if (ok) {
        lastSynced.current = key;
      } else {
        retry = window.setTimeout(() => void run(), 15_000);
      }
    };
    const timer = window.setTimeout(() => void run(), 1_200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (retry !== undefined) window.clearTimeout(retry);
    };
  }, [signature, user]);

  return null;
}
