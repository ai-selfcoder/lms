"use client";

import { useEffect, useState } from "react";

const ARTIFACTS_KEY = "goconc.project-artifacts.v1";
const ARTIFACTS_EVENT = "goconc:project-artifacts-changed";

export type ProjectArtifactStatus = "draft" | "verified";

export interface ProjectArtifact {
  trackId: string;
  status: ProjectArtifactStatus;
  evidence: string;
  updatedAt: string;
}

function readArtifacts(): ProjectArtifact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ARTIFACTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is ProjectArtifact => item && typeof item.trackId === "string" && (item.status === "draft" || item.status === "verified") && typeof item.evidence === "string" && typeof item.updatedAt === "string")
      : [];
  } catch {
    return [];
  }
}

function writeArtifacts(artifacts: ProjectArtifact[]) {
  try {
    window.localStorage.setItem(ARTIFACTS_KEY, JSON.stringify(artifacts.slice(-40)));
    window.dispatchEvent(new Event(ARTIFACTS_EVENT));
  } catch {
    /* local-first behavior still works when storage is unavailable */
  }
}

export function getProjectArtifacts(): ProjectArtifact[] {
  return readArtifacts();
}

export function saveProjectArtifact(input: Omit<ProjectArtifact, "updatedAt">): ProjectArtifact {
  const artifact: ProjectArtifact = { ...input, evidence: input.evidence.trim().slice(0, 2000), updatedAt: new Date().toISOString() };
  const next = readArtifacts().filter((item) => item.trackId !== artifact.trackId);
  next.push(artifact);
  writeArtifacts(next);
  return artifact;
}

export function useProjectArtifacts(): ProjectArtifact[] {
  const [artifacts, setArtifacts] = useState<ProjectArtifact[]>([]);
  useEffect(() => {
    const sync = () => setArtifacts(readArtifacts());
    sync();
    window.addEventListener(ARTIFACTS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ARTIFACTS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return artifacts;
}
