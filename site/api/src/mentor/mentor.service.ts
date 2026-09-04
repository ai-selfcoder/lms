import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ReviewDto } from './dto/review.dto';

// Структура разбора, которую модель обязана вернуть.
const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    verdict: { type: 'string', enum: ['solid', 'minor-issues', 'has-bugs'] },
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          severity: {
            type: 'string',
            enum: ['critical', 'major', 'minor', 'info'],
          },
          category: {
            type: 'string',
            enum: [
              'race',
              'leak',
              'deadlock',
              'correctness',
              'idiom',
              'performance',
              'style',
            ],
          },
          explanation: { type: 'string' },
          suggestion: { type: 'string' },
        },
        required: ['title', 'severity', 'category', 'explanation', 'suggestion'],
      },
    },
    idiomatic: { type: 'array', items: { type: 'string' } },
    followups: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'summary', 'findings', 'idiomatic', 'followups'],
};

const SYSTEM = `Ты — старший Go-инженер из бигтеха, ведёшь секцию «Платформа» на собеседовании.
Тебе дают решение задачи по конкурентности Go. Разбери ИМЕННО код кандидата (а не «как надо вообще»):
найди гонки данных, утечки горутин, дедлоки, ошибки корректности, неидиоматичность и лишние аллокации.
Будь конкретным и привязывайся к коду кандидата; не переписывай решение целиком — указывай точечные правки.
Тон — дружелюбно-строгий, как сильный ментор. По-русски, на «ты», без воды и без эмодзи.
Если решение хорошее — так и скажи, не выдумывай проблемы.`;

type ProviderResult = { json: unknown; model: string; input: number; output: number };

// Снимаем markdown-обёртки и вырезаем JSON-объект, если модель добавила текст.
function parseJsonLoose(raw: string): unknown {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  try {
    return JSON.parse(s);
  } catch {
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    if (a !== -1 && b > a) return JSON.parse(s.slice(a, b + 1));
    throw new Error('модель вернула не-JSON');
  }
}

@Injectable()
export class MentorService {
  private readonly logger = new Logger(MentorService.name);
  private readonly provider: string;
  private readonly anthropic: Anthropic | null;
  private readonly anthropicModel: string;
  private readonly deepseekKey: string | undefined;
  private readonly deepseekModel: string;
  private readonly deepseekUrl: string;
  private readonly maxTokens: number;

  constructor() {
    this.provider = (process.env.MENTOR_PROVIDER || 'deepseek').toLowerCase();
    const aKey = process.env.ANTHROPIC_API_KEY;
    this.anthropic = aKey ? new Anthropic({ apiKey: aKey }) : null;
    this.anthropicModel = process.env.MENTOR_MODEL || 'claude-haiku-4-5';
    this.deepseekKey = process.env.DEEPSEEK_API_KEY || undefined;
    this.deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
    this.deepseekUrl =
      process.env.DEEPSEEK_URL || 'https://api.deepseek.com/chat/completions';
    this.maxTokens = Number(process.env.MENTOR_MAX_TOKENS) || 4000;
  }

  get configured(): boolean {
    return this.provider === 'anthropic'
      ? this.anthropic !== null
      : !!this.deepseekKey;
  }

  async review(dto: ReviewDto) {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'AI-ментор не настроен: задай ключ провайдера в site/api/.env (DEEPSEEK_API_KEY или ANTHROPIC_API_KEY).',
      );
    }
    const user = this.buildPrompt(dto);
    try {
      const r =
        this.provider === 'anthropic'
          ? await this.callAnthropic(user)
          : await this.callDeepSeek(user);
      return {
        ...(r.json as object),
        model: r.model,
        usage: { input: r.input, output: r.output },
      };
    } catch (err) {
      this.logger.error('mentor review failed', err as Error);
      throw new ServiceUnavailableException('AI-ментор временно недоступен');
    }
  }

  private buildPrompt(dto: ReviewDto): string {
    const parts: string[] = [];
    if (dto.title) parts.push(`Задача: ${dto.title}`);
    if (dto.type === 'review') {
      parts.push(
        'Тип задачи: code-review — кандидату дан багованный код, который он должен починить. Оценивай, все ли гонки/утечки устранены.',
      );
    }
    if (dto.problem) parts.push(`Условие:\n${dto.problem.slice(0, 12000)}`);
    if (dto.testOutput) {
      parts.push(
        `Результат прогона go test -race (для контекста):\n${dto.testOutput.slice(0, 8000)}`,
      );
    }
    parts.push(`Решение кандидата:\n\`\`\`go\n${dto.code}\n\`\`\``);
    return parts.join('\n\n');
  }

  // ── Anthropic (Claude) — strict json_schema ──────────────────────────────
  private async callAnthropic(user: string): Promise<ProviderResult> {
    const res = await this.anthropic!.messages.create({
      model: this.anthropicModel,
      max_tokens: this.maxTokens,
      system: SYSTEM,
      output_config: { format: { type: 'json_schema', schema: REVIEW_SCHEMA } },
      messages: [{ role: 'user', content: `${user}\n\nРазбери это решение по схеме.` }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const text = res.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') throw new Error('пустой ответ модели');
    return {
      json: JSON.parse(text.text),
      model: res.model,
      input: res.usage.input_tokens,
      output: res.usage.output_tokens,
    };
  }

  // ── DeepSeek (OpenAI-совместимый) — JSON mode ────────────────────────────
  private async callDeepSeek(user: string): Promise<ProviderResult> {
    const schemaHint =
      'Верни СТРОГО один JSON-объект (без markdown, без текста вокруг) по схеме: ' +
      JSON.stringify(REVIEW_SCHEMA);
    const res = await fetch(this.deepseekUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.deepseekKey}`,
      },
      body: JSON.stringify({
        model: this.deepseekModel,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${SYSTEM}\n\n${schemaHint}` },
          { role: 'user', content: `${user}\n\nОтветь строго одним JSON-объектом по схеме.` },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`deepseek ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const data: any = await res.json(); // eslint-disable-line @typescript-eslint/no-explicit-any
    const u = data?.usage ?? {};
    this.logger.log(
      `deepseek cache: hit=${u.prompt_cache_hit_tokens ?? 0} miss=${u.prompt_cache_miss_tokens ?? 0} out=${u.completion_tokens ?? 0}`,
    );
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    if (!content) throw new Error('пустой ответ модели');
    return {
      json: parseJsonLoose(content),
      model: data?.model ?? this.deepseekModel,
      input: data?.usage?.prompt_tokens ?? 0,
      output: data?.usage?.completion_tokens ?? 0,
    };
  }
}
