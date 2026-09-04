import type { QuizQuestion } from "@/lib/content";

/** A learner's response: an option index (single), a set of indices (multi),
 * or a typed number (number). `null` means "not answered yet". */
export type QuizResponse = number | number[] | null;

/** Whether a response exactly matches the question's expected answer. Pure. */
export function isCorrect(question: QuizQuestion, response: QuizResponse): boolean {
  if (response === null) return false;

  if (question.type === "multi") {
    if (!Array.isArray(response) || !Array.isArray(question.answer)) return false;
    const got = new Set(response);
    const want = new Set(question.answer);
    if (got.size !== want.size) return false;
    for (const v of want) if (!got.has(v)) return false;
    return true;
  }

  // single & number: exact scalar match
  if (Array.isArray(response) || Array.isArray(question.answer)) return false;
  return response === question.answer;
}
