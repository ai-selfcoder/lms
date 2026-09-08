import { beforeEach, describe, expect, it } from "vitest";
import { getProjectArtifacts, saveProjectArtifact } from "./projectArtifacts";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  clear() { this.values.clear(); }
}

const storage = new MemoryStorage();

beforeEach(() => {
  storage.clear();
  Object.assign(globalThis, { window: { localStorage: storage, dispatchEvent: () => true } });
});

describe("project artifacts", () => {
  it("upserts a normalized evidence record per track", () => {
    saveProjectArtifact({ trackId: "worker-pool", status: "draft", evidence: "  first pass  " });
    saveProjectArtifact({ trackId: "worker-pool", status: "verified", evidence: "  tests and benchmark  " });
    expect(getProjectArtifacts()).toHaveLength(1);
    expect(getProjectArtifacts()[0]).toMatchObject({ trackId: "worker-pool", status: "verified", evidence: "tests and benchmark" });
  });
});
