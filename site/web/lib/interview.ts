"use client";

import { useEffect, useState } from "react";

const KEY = "goconc.interview.v1";
export const INTERVIEW_EVENT = "goconc:interview-changed";

export interface InterviewSession {
  id: string;
  taskIds: string[];
  startedAt: string;
  durationSec: number;
  endedAt?: string;
  endReason?: "manual" | "timeout";
}

function read(): InterviewSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as InterviewSession;
    if (!value || typeof value.id !== "string" || !Array.isArray(value.taskIds) || typeof value.startedAt !== "string") return null;
    return value;
  } catch {
    return null;
  }
}

function write(session: InterviewSession | null) {
  try {
    if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
    else window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(INTERVIEW_EVENT));
  } catch {
    /* ignore private mode / quota errors */
  }
}

export function getInterviewSession(): InterviewSession | null {
  return read();
}

export function saveInterviewSession(session: InterviewSession) {
  write(session);
}

export function finishInterview(reason: "manual" | "timeout" = "manual") {
  const current = read();
  if (!current || current.endedAt) return current;
  const next = { ...current, endedAt: new Date().toISOString(), endReason: reason } as InterviewSession;
  write(next);
  return next;
}

export function useInterviewSession() {
  const [session, setSession] = useState<InterviewSession | null>(null);
  useEffect(() => {
    const sync = () => setSession(read());
    sync();
    window.addEventListener(INTERVIEW_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(INTERVIEW_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return session;
}
