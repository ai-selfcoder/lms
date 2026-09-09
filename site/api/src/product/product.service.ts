import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const VALID_GOALS = new Set(['basics', 'go', 'concurrency', 'os', 'interview', 'promotion', 'role-change']);
const PLAN_ORDER = ['FREE', 'PRO', 'TEAM', 'REVIEW_ADDON'] as const;
const CHECKOUT_PLANS = new Set(['PRO', 'TEAM', 'REVIEW_ADDON']);

type ReportSkill = {
  key: string;
  courseId: string;
  taskId: string;
  title: string;
  slug?: string;
  difficulty?: string;
  passedAt?: string;
  firstAttemptAt?: string;
  lastAttemptAt?: string;
  tests?: Array<{ name: string; status: string; elapsedMs?: number }>;
  testsPassed?: number;
  testsTotal?: number;
  graderLatencyMs?: number;
  summary?: string;
};

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async entitlements(userId: string) {
    const rows = await this.prisma.entitlement.findMany({ where: { userId, active: true, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] }, orderBy: { createdAt: 'desc' } });
    const plans = new Set(rows.map((row) => row.plan));
    plans.add('FREE');
    return { plans: PLAN_ORDER.filter((plan) => plans.has(plan)), entitlements: rows.map((row) => ({ plan: row.plan, source: row.source, startsAt: row.startsAt, endsAt: row.endsAt })) };
  }

  async setGoal(userId: string, rawGoal: string) {
    const goal = rawGoal.trim().toLowerCase();
    if (!VALID_GOALS.has(goal)) return { goal: 'go' };
    return this.prisma.careerProfile.upsert({ where: { userId }, create: { userId, goal }, update: { goal }, select: { goal: true, updatedAt: true } });
  }

  async createReport(userId: string, body: { title?: string; goal?: string; skills?: unknown[] }) {
    const passes = await this.prisma.taskPass.findMany({ where: { userId }, orderBy: { passedAt: 'asc' }, select: { taskId: true, courseId: true, taskTitle: true, taskSlug: true, difficulty: true, testsPassed: true, testsTotal: true, graderLatencyMs: true, firstAttemptAt: true, lastAttemptAt: true, passedAt: true } });
    const profile = await this.prisma.careerProfile.findUnique({ where: { userId }, select: { goal: true } });
    const previous = await this.prisma.skillReport.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { payloadJson: true } });
    const previousSkills = this.readSkills(previous?.payloadJson);
    const incomingSkills = Array.isArray(body.skills) ? body.skills.map((skill) => this.normalizeSkill(skill)).filter((skill): skill is ReportSkill => Boolean(skill)) : [];
    const passSkills = passes.map((pass): ReportSkill => ({
      key: `${pass.courseId}:${pass.taskId}`,
      courseId: pass.courseId,
      taskId: pass.taskId,
      title: pass.taskTitle || pass.taskId,
      slug: pass.taskSlug || undefined,
      difficulty: pass.difficulty || undefined,
      testsPassed: pass.testsPassed ?? undefined,
      testsTotal: pass.testsTotal ?? undefined,
      graderLatencyMs: pass.graderLatencyMs ?? undefined,
      firstAttemptAt: pass.firstAttemptAt?.toISOString(),
      lastAttemptAt: pass.lastAttemptAt?.toISOString(),
      passedAt: pass.passedAt.toISOString(),
    }));
    const skills = [...previousSkills, ...passSkills, ...incomingSkills].reduce<ReportSkill[]>((all, skill) => {
      const index = all.findIndex((item) => item.key === skill.key);
      if (index === -1) all.push(skill);
      else all[index] = { ...all[index], ...skill, tests: skill.tests ?? all[index].tests };
      return all;
    }, []).slice(-100);
    const payload = { schemaVersion: 2, generatedAt: new Date().toISOString(), passes, skills, roleConnection: 'Backend / system engineering', nextGap: passes.length ? 'Закрой следующий skill track после последнего PASS' : 'Запусти первую runnable-задачу' };
    const report = await this.prisma.skillReport.create({ data: { userId, title: body.title?.trim() || 'Verified skill report', goal: body.goal?.trim() || profile?.goal, payloadJson: JSON.stringify(payload) }, select: { id: true, token: true, title: true, goal: true, isPublic: true, createdAt: true, payloadJson: true } });
    return this.present(report);
  }

  async checkoutIntent(userId: string, rawPlan: string, rawPrice?: string) {
    const plan = rawPlan.trim().toUpperCase();
    if (!CHECKOUT_PLANS.has(plan)) return { accepted: false, reason: 'unsupported_plan' };
    const priceHypothesis = rawPrice?.trim().slice(0, 80) || null;
    const intent = await this.prisma.checkoutIntent.create({ data: { userId, plan, priceHypothesis }, select: { id: true, plan: true, priceHypothesis: true, status: true, createdAt: true } });
    return { accepted: true, intent };
  }

  async latestReport(userId: string) {
    const report = await this.prisma.skillReport.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return report ? this.present(report) : null;
  }

  async shareReport(userId: string, id: string, isPublic: boolean) {
    const report = await this.prisma.skillReport.findFirst({ where: { id, userId } });
    if (!report) throw new NotFoundException('Отчёт не найден');
    return this.present(await this.prisma.skillReport.update({ where: { id }, data: { isPublic }, select: { id: true, token: true, title: true, goal: true, isPublic: true, createdAt: true, payloadJson: true } }));
  }

  async sharedReport(token: string) {
    const report = await this.prisma.skillReport.findFirst({ where: { token, isPublic: true }, select: { id: true, token: true, title: true, goal: true, isPublic: true, createdAt: true, payloadJson: true } });
    if (!report) throw new NotFoundException('Публичный отчёт не найден');
    return this.present(report);
  }

  private present(report: { id: string; token: string; title: string; goal: string | null; isPublic: boolean; createdAt: Date; payloadJson: string }) {
    let payload: unknown = {};
    try { payload = JSON.parse(report.payloadJson); } catch { /* old malformed rows remain readable */ }
    return { id: report.id, token: report.token, title: report.title, goal: report.goal, isPublic: report.isPublic, createdAt: report.createdAt, payload };
  }

  private readSkills(raw?: string): ReportSkill[] {
    if (!raw) return [];
    try {
      const value = JSON.parse(raw) as { skills?: unknown };
      return Array.isArray(value.skills) ? value.skills.map((skill) => this.normalizeSkill(skill)).filter((skill): skill is ReportSkill => Boolean(skill)) : [];
    } catch { return []; }
  }

  private normalizeSkill(value: unknown): ReportSkill | null {
    if (!value || typeof value !== 'object') return null;
    const input = value as Record<string, unknown>;
    const taskId = typeof input.taskId === 'string' ? input.taskId.trim().slice(0, 120) : '';
    if (!taskId) return null;
    const courseId = typeof input.course === 'string' && input.course ? input.course.slice(0, 40) : typeof input.courseId === 'string' && input.courseId ? input.courseId.slice(0, 40) : 'go';
    const title = typeof input.title === 'string' && input.title ? input.title.slice(0, 180) : taskId;
    const tests = Array.isArray(input.tests) ? input.tests.map((test) => {
      if (!test || typeof test !== 'object') return null;
      const row = test as Record<string, unknown>;
      return typeof row.name === 'string' && typeof row.status === 'string' ? { name: row.name.slice(0, 120), status: row.status.slice(0, 20), elapsedMs: typeof row.elapsedMs === 'number' && Number.isFinite(row.elapsedMs) ? Math.max(0, Math.round(row.elapsedMs)) : undefined } : null;
    }).filter((test): test is { name: string; status: string; elapsedMs: number | undefined } => Boolean(test)).slice(0, 80) : undefined;
    const finite = (key: string) => typeof input[key] === 'number' && Number.isFinite(input[key]) ? Math.max(0, Math.round(input[key] as number)) : undefined;
    const iso = (key: string) => typeof input[key] === 'string' && !Number.isNaN(Date.parse(input[key] as string)) ? new Date(input[key] as string).toISOString() : undefined;
    return { key: `${courseId}:${taskId}`, courseId, taskId, title, slug: typeof input.slug === 'string' ? input.slug.slice(0, 180) : undefined, difficulty: typeof input.difficulty === 'string' ? input.difficulty.slice(0, 40) : undefined, passedAt: iso('passedAt'), firstAttemptAt: iso('firstAttemptAt'), lastAttemptAt: iso('lastAttemptAt'), tests, testsPassed: finite('testsPassed'), testsTotal: finite('testsTotal'), graderLatencyMs: finite('graderLatencyMs'), summary: typeof input.summary === 'string' ? input.summary.slice(0, 240) : undefined };
  }
}
