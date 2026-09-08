"use client";

import { useEffect, useRef } from "react";
import { syncLearningEvents, useAuth } from "@/lib/auth";
import { useLearningEvents } from "@/lib/progress";
import { isAnalyticsOptedOut } from "@/lib/privacy";

/**
 * Batches newly recorded learning actions during an authenticated session.
 * The server endpoint is idempotent, so a reload or interrupted request never
 * creates duplicate events.
 */
export function LearningEventSync() {
  const { user } = useAuth();
  const events = useLearningEvents();
  const lastSynced = useRef<string | null>(null);
  const lastId = events.at(-1)?.id ?? "";
  const signature = lastId ? `${events.length}:${lastId}` : "";

  useEffect(() => {
    if (!user || !signature || isAnalyticsOptedOut()) return;
    const key = `${user.id}:${signature}`;
    if (lastSynced.current === key) return;

    const timer = window.setTimeout(() => {
      void syncLearningEvents(user.id).then((ok) => {
        if (ok) lastSynced.current = key;
      });
    }, 750);
    return () => window.clearTimeout(timer);
  }, [signature, user]);

  return null;
}
