export type ProjectStepKind = "task" | "chapter" | "lab";

export interface ProjectStep {
  id: string;
  kind: ProjectStepKind;
  title: string;
  href: string;
  note: string;
  /** Local progress id. Tasks use their plain id; chapters/labs use namespaced ids. */
  statusId: string;
}

export interface ProjectTrack {
  id: string;
  title: string;
  kicker: string;
  description: string;
  outcome: string;
  estimate: string;
  steps: ProjectStep[];
}

/**
 * Small, finishable project slices assembled from canonical course content.
 * Keep this list declarative so the project surface stays an index, not a
 * second task system.
 */
export const PROJECT_TRACKS: ProjectTrack[] = [
  {
    id: "worker-pool",
    title: "Worker pool",
    kicker: "GO / CONCURRENCY",
    description: "Собери bounded pool, который переживает отмену, ошибки и корректное завершение.",
    outcome: "Готовый каркас фоновой обработки с контролируемым числом горутин.",
    estimate: "4 шага · 45–60 мин",
    steps: [
      { id: "worker-pool-1", kind: "task", title: "Bounded Worker Pool с обработкой ошибок", href: "/go/tasks/bounded-worker-pool", note: "Очередь работ и ограничение параллелизма", statusId: "10" },
      { id: "worker-pool-2", kind: "task", title: "Context-Aware Worker Pool", href: "/go/tasks/context-aware-pool", note: "Отмена без зависших отправителей", statusId: "28" },
      { id: "worker-pool-3", kind: "task", title: "Graceful Shutdown с таймаутом", href: "/go/tasks/graceful-shutdown-timeout", note: "Закрытие пула в заданное время", statusId: "30" },
      { id: "worker-pool-4", kind: "task", title: "Worker Pool с динамическим масштабированием", href: "/go/tasks/scaling-worker-pool", note: "Масштабирование без гонок и утечек", statusId: "23" },
    ],
  },
  {
    id: "rate-limiter",
    title: "Rate limiter",
    kicker: "GO / HIGHLOAD",
    description: "Сравни token bucket и leaky bucket, затем встрои ограничитель в конвейер.",
    outcome: "Понятный выбор политики под burst-трафик и устойчивый RPS-контур.",
    estimate: "3 шага · 35–50 мин",
    steps: [
      { id: "rate-limiter-1", kind: "task", title: "Token Bucket Rate Limiter", href: "/go/tasks/token-bucket-rate-limiter", note: "Burst capacity и точное окно времени", statusId: "16" },
      { id: "rate-limiter-2", kind: "task", title: "Leaky Bucket", href: "/go/tasks/leaky-bucket", note: "Сглаживание всплесков через ticker", statusId: "17" },
      { id: "rate-limiter-3", kind: "task", title: "Rate-Limited Pipeline", href: "/go/tasks/rate-limited-pipeline", note: "50 RPS на многостадийном pipeline", statusId: "27" },
    ],
  },
  {
    id: "mini-scheduler",
    title: "Mini scheduler",
    kicker: "GO + OS",
    description: "От очереди задач в Go до наблюдаемого Round Robin и цены переключений контекста.",
    outcome: "Рабочая модель планировщика и способность объяснить её метрики.",
    estimate: "4 шага · 45–60 мин",
    steps: [
      { id: "mini-scheduler-1", kind: "task", title: "Cron Worker Pool", href: "/go/tasks/cron-scheduler", note: "Периодические задачи и остановка", statusId: "31" },
      { id: "mini-scheduler-2", kind: "task", title: "Priority Worker Pool", href: "/go/tasks/priority-worker-pool", note: "Очередь с приоритетом и ожиданием", statusId: "25" },
      { id: "mini-scheduler-3", kind: "chapter", title: "Планирование CPU", href: "/os/book/scheduling", note: "Почему fairness и throughput конфликтуют", statusId: "os:chapter:scheduling" },
      { id: "mini-scheduler-4", kind: "lab", title: "Round Robin", href: "/os/sim/rr", note: "Поменяй quantum и сравни отклик", statusId: "os:lab:rr" },
    ],
  },
  {
    id: "page-cache",
    title: "Page cache",
    kicker: "GO + OS",
    description: "Свяжи конкурентный кэш с политиками вытеснения страниц и измерь промахи.",
    outcome: "Модель кэша, в которой видны contention, locality и стоимость miss.",
    estimate: "4 шага · 45–60 мин",
    steps: [
      { id: "page-cache-1", kind: "task", title: "Потокобезопасный кэш (95% reads)", href: "/go/tasks/rwmutex-cache", note: "RWMutex и read-heavy нагрузка", statusId: "06" },
      { id: "page-cache-2", kind: "task", title: "Singleflight", href: "/go/tasks/singleflight", note: "Защита от cache stampede", statusId: "18" },
      { id: "page-cache-3", kind: "chapter", title: "Вытеснение страниц", href: "/os/book/paging", note: "Locality и цена page fault", statusId: "os:chapter:paging" },
      { id: "page-cache-4", kind: "lab", title: "Вытеснение страниц", href: "/os/sim/page-lru", note: "Сравни FIFO, LRU, Clock и OPT", statusId: "os:lab:page-lru" },
    ],
  },
];
