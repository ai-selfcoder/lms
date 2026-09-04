import { describe, it, expect } from "vitest";
import { parseBlocks } from "./blocks";

describe("parseBlocks", () => {
  it("returns a single markdown block when there are no markers", () => {
    const blocks = parseBlocks("# Заголовок\n\nОбычный текст.");
    expect(blocks).toEqual([
      { type: "md", content: "# Заголовок\n\nОбычный текст." },
    ]);
  });

  it("splits a <Sim> marker out of the surrounding markdown", () => {
    const src = "Текст до.\n\n<Sim id=\"rr-scheduler\" />\n\nТекст после.";
    expect(parseBlocks(src)).toEqual([
      { type: "md", content: "Текст до." },
      { type: "sim", id: "rr-scheduler" },
      { type: "md", content: "Текст после." },
    ]);
  });

  it("recognises a <Quiz> marker", () => {
    expect(parseBlocks("<Quiz id=\"sched-metrics\" />")).toEqual([
      { type: "quiz", id: "sched-metrics" },
    ]);
  });

  it("drops empty markdown between adjacent markers", () => {
    const src = "<Sim id=\"a\" />\n\n<Quiz id=\"b\" />";
    expect(parseBlocks(src)).toEqual([
      { type: "sim", id: "a" },
      { type: "quiz", id: "b" },
    ]);
  });

  it("ignores a marker that is not alone on its line (stays prose)", () => {
    const src = "Смотри <Sim id=\"x\" /> в тексте.";
    expect(parseBlocks(src)).toEqual([
      { type: "md", content: "Смотри <Sim id=\"x\" /> в тексте." },
    ]);
  });
});
