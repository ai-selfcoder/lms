export type DiagnosticQuestionId = "career" | "experience" | "blocker" | "intent";

export type DiagnosticAnswers = Partial<Record<DiagnosticQuestionId, string>>;

export type DiagnosticRoute = "go-basics" | "go" | "os" | "interview";

export interface DiagnosticRecommendation {
  route: DiagnosticRoute;
  label: string;
  title: string;
  description: string;
  reason: string;
}

export const DIAGNOSTIC_QUESTIONS: ReadonlyArray<{
  id: DiagnosticQuestionId;
  title: string;
  options: ReadonlyArray<{ value: string; label: string; hint: string }>;
}> = [
  {
    id: "career",
    title: "Какой карьерный результат нужен в ближайшие 3 месяца?",
    options: [
      { value: "new-role", label: "Войти в backend / Go", hint: "Собрать базу и первое доказательство практики" },
      { value: "promotion", label: "Получить повышение", hint: "Закрыть пробелы production-разработчика" },
      { value: "interview", label: "Пройти сильное интервью", hint: "Тренироваться в условиях, близких к собеседованию" },
    ],
  },
  {
    id: "experience",
    title: "Как ты сейчас пишешь на Go?",
    options: [
      { value: "new", label: "Только начинаю", hint: "Синтаксис и базовые конструкции ещё не автоматизировались" },
      { value: "working", label: "Пишу рабочие сервисы", hint: "Хочу увереннее разбираться в поведении кода" },
      { value: "advanced", label: "Уверенно пишу на Go", hint: "Ищу системные детали и сложные failure modes" },
    ],
  },
  {
    id: "blocker",
    title: "Что сейчас мешает зарабатывать больше?",
    options: [
      { value: "syntax", label: "Пробелы в базе", hint: "Типы, ошибки и структура кода требуют уверенности" },
      { value: "concurrency", label: "Горутины и надёжность", hint: "Гонки, deadlock, утечки и поведение под нагрузкой" },
      { value: "systems", label: "Системное мышление", hint: "Память, планирование, I/O и внутренние механизмы" },
    ],
  },
];

const RECOMMENDATIONS: Record<DiagnosticRoute, DiagnosticRecommendation> = {
  "go-basics": {
    route: "go-basics",
    label: "Основы Go",
    title: "Начни с безопасной базы Go",
    description: "Короткие главы и runnable-примеры помогут собрать рабочую модель языка до конкурентности.",
    reason: "По ответам тебе сейчас важнее закрепить фундамент, чтобы дальнейшая практика не превращалась в угадайку.",
  },
  go: {
    route: "go",
    label: "Практика Go",
    title: "Перейди к задаче по конкурентности",
    description: "Реши небольшую задачу и сразу проверь инварианты через go test -race.",
    reason: "У тебя уже есть база, поэтому быстрее всего будет проверить понимание действием и обратной связью.",
  },
  os: {
    route: "os",
    label: "Операционные системы",
    title: "Исследуй поведение системы в лаборатории",
    description: "Начни с главы про процессы, затем запусти симулятор и свяжи наблюдение с механизмом ОС.",
    reason: "Твой вопрос лежит ниже уровня API: симулятор даст наблюдаемое объяснение, а не только термин.",
  },
  interview: {
    route: "interview",
    label: "Режим интервью",
    title: "Запусти честную тренировку интервью",
    description: "Случайный набор задач, таймер и разбор результата без публичного рейтинга скорости.",
    reason: "Ограничение по времени и проверяемый результат лучше всего соответствуют твоей ближайшей цели.",
  },
};

export function diagnosticIsComplete(answers: DiagnosticAnswers): boolean {
  const hasCareer = typeof answers.career === "string" && answers.career.length > 0;
  const hasLegacyIntent = typeof answers.intent === "string" && answers.intent.length > 0;
  return typeof answers.experience === "string" && answers.experience.length > 0
    && typeof answers.blocker === "string" && answers.blocker.length > 0
    && (hasCareer || hasLegacyIntent);
}

export function getDiagnosticRecommendation(answers: DiagnosticAnswers): DiagnosticRecommendation | null {
  if (!diagnosticIsComplete(answers)) return null;

  const experience = answers.experience;
  const blocker = answers.blocker;
  if (answers.career === "interview" || answers.intent === "interview") return RECOMMENDATIONS.interview;
  if (blocker === "systems") return RECOMMENDATIONS.os;
  if (experience === "new" || blocker === "syntax") return RECOMMENDATIONS["go-basics"];
  return RECOMMENDATIONS.go;
}
