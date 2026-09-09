import type { Metadata } from "next";
import Link from "next/link";

const PROBLEMS = {
  "race-conditions": { title: "Race conditions в backend", summary: "Научись воспроизводить гонку, читать race report и закрывать инвариант в runnable-задаче.", failure: "Два обработчика меняют общий state одновременно.", experiment: "Запусти тест с -race и сравни поведение до и после синхронизации.", task: "thread-safe-counter", label: "Thread-safe Counter" },
  deadlocks: { title: "Deadlock и зависшие запросы", summary: "Разбери взаимную блокировку на коротком эксперименте и докажи корректное завершение.", failure: "Сервисы ждут друг друга и перестают отвечать под нагрузкой.", experiment: "Найди порядок захвата lock и проверь, что система освобождает ресурсы.", task: "custom-waitgroup-cond", label: "WaitGroup своими руками" },
  "goroutine-leaks": { title: "Утечки горутин", summary: "Воспроизведи утечку, добавь отмену и получи PASS с проверяемым инвариантом.", failure: "Фоновая горутина остаётся ждать канал после отмены запроса.", experiment: "Сравни число горутин до и после timeout и graceful shutdown.", task: "unbuffered-channel-goroutine-leak", label: "Unbuffered канал и утечка горутины" },
  "graceful-shutdown": { title: "Graceful shutdown", summary: "Построй остановку сервиса с таймаутом, отменой и контролем незавершённых работ.", failure: "Процесс завершается, теряя запросы или оставляя воркеры.", experiment: "Проверь дедлайн остановки и поведение очереди во время SIGTERM.", task: "graceful-shutdown-timeout", label: "Graceful Shutdown с таймаутом" },
} as const;

type ProblemSlug = keyof typeof PROBLEMS;

export function generateStaticParams() { return Object.keys(PROBLEMS).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const problem = PROBLEMS[slug as ProblemSlug];
  return { title: problem ? `${problem.title} | GraphLMS` : "Backend failure labs | GraphLMS", description: problem?.summary };
}

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = PROBLEMS[slug as ProblemSlug];
  if (!problem) return <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 20px" }}><h1>Проблема не найдена</h1><Link href="/">На главную</Link></main>;
  return <main className="problem-page">
    <div className="problem-kicker">FAILURE LAB · BACKEND ENGINEERING</div>
    <h1>{problem.title}</h1>
    <p className="problem-summary">{problem.summary}</p>
    <div className="problem-loop"><article><span>FAILURE</span><strong>{problem.failure}</strong></article><article><span>EXPERIMENT</span><strong>{problem.experiment}</strong></article><article><span>PROOF</span><strong>PASS в {problem.label}, тесты и инварианты попадут в skill report.</strong></article></div>
    <div className="problem-actions"><Link className="primary-action" href={`/go/tasks/${problem.task}`}>Запустить runnable-задачу ↗</Link><Link className="quiet-action" href="/account/report">Посмотреть формат доказательства ↗</Link></div>
    <p className="problem-note">Сначала запускается задача и проверка. Оплата не нужна для первого проверяемого результата.</p>
    <style>{`.problem-page{max-width:880px;margin:0 auto;padding:72px 28px 100px;color:var(--text-primary)}.problem-kicker{color:var(--accent-text);font:11px var(--font-mono);letter-spacing:.1em}.problem-page h1{margin:14px 0 10px;font-size:44px;letter-spacing:-.04em}.problem-summary{max-width:680px;margin:0;color:var(--text-secondary);font-size:17px;line-height:1.55}.problem-loop{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:34px}.problem-loop article{min-height:128px;padding:16px;border:1px solid var(--border-default);border-radius:6px;background:var(--bg-elevated)}.problem-loop span{display:block;color:var(--text-tertiary);font:10px var(--font-mono);letter-spacing:.08em}.problem-loop strong{display:block;margin-top:12px;color:var(--text-primary);font-size:14px;line-height:1.45;font-weight:500}.problem-actions{display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-top:30px}.problem-note{margin-top:20px;color:var(--text-tertiary);font-size:12px}@media(max-width:700px){.problem-page{padding:48px 16px 72px}.problem-page h1{font-size:34px}.problem-loop{grid-template-columns:1fr}.problem-loop article{min-height:auto}.problem-actions{align-items:flex-start;flex-direction:column}}`}</style>
  </main>;
}
