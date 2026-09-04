"use client";

import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Runnable } from "./Runnable";

function decode(b64: string): string {
  if (typeof window !== "undefined") return decodeURIComponent(escape(window.atob(b64)));
  return Buffer.from(b64, "base64").toString("utf8");
}

// Roots are tracked per element in a module-level WeakMap so they survive React
// StrictMode's double effect invocation (dev): the second mount sees the element
// already has a root and skips it, instead of blanking it.
const ROOTS = new WeakMap<HTMLElement, Root>();

// Finds [data-runnable] placeholders from markdown and replaces them with the
// interactive <Runnable>.
//
// Teardown is DEFERRED (queueMicrotask) and only unmounts elements that have
// actually left the DOM. This threads the needle between two failure modes:
//   - synchronous unmount in cleanup -> React warns "synchronously unmount a
//     root while React was already rendering";
//   - unconditional deferred unmount -> StrictMode's remount races and blanks
//     the islands.
// On a real navigation the elements are disconnected, so they unmount; on the
// StrictMode re-run they stay connected, so they're left mounted.
export function RunnableMounter() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-runnable]"));
    for (const el of nodes) {
      if (ROOTS.has(el)) continue;
      const code = decode(el.getAttribute("data-code") ?? "");
      el.replaceChildren(); // remove the static fallback (no innerHTML)
      const root = createRoot(el);
      root.render(<Runnable initialCode={code} />);
      ROOTS.set(el, root);
    }
    return () => {
      queueMicrotask(() => {
        for (const el of nodes) {
          if (el.isConnected) continue; // still on the page (StrictMode re-run)
          const root = ROOTS.get(el);
          if (root) {
            root.unmount();
            ROOTS.delete(el);
          }
        }
      });
    };
  }, []);
  return null;
}
