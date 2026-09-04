import { describe, it, expect } from "vitest";
import { isCorrect } from "./quiz";
import type { QuizQuestion } from "@/lib/content";

const single: QuizQuestion = {
  q: "Какая политика оптимальна по среднему обороту при равном приходе?",
  type: "single",
  options: ["FIFO", "SJF", "RR"],
  answer: 1,
};

const multi: QuizQuestion = {
  q: "Что улучшает отклик?",
  type: "multi",
  options: ["RR", "маленький квант", "FIFO"],
  answer: [0, 1],
};

const numeric: QuizQuestion = {
  q: "Сколько переключений за период?",
  type: "number",
  answer: 4,
};

describe("isCorrect · single", () => {
  it("accepts the right index", () => {
    expect(isCorrect(single, 1)).toBe(true);
  });
  it("rejects a wrong index", () => {
    expect(isCorrect(single, 0)).toBe(false);
  });
  it("treats no answer as incorrect", () => {
    expect(isCorrect(single, null)).toBe(false);
  });
});

describe("isCorrect · multi", () => {
  it("accepts the exact set regardless of order", () => {
    expect(isCorrect(multi, [1, 0])).toBe(true);
  });
  it("rejects a subset (missing one)", () => {
    expect(isCorrect(multi, [0])).toBe(false);
  });
  it("rejects a superset (extra wrong option)", () => {
    expect(isCorrect(multi, [0, 1, 2])).toBe(false);
  });
  it("treats empty selection as incorrect", () => {
    expect(isCorrect(multi, [])).toBe(false);
  });
});

describe("isCorrect · number", () => {
  it("accepts the exact number", () => {
    expect(isCorrect(numeric, 4)).toBe(true);
  });
  it("rejects a wrong number", () => {
    expect(isCorrect(numeric, 5)).toBe(false);
  });
});
