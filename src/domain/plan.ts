import { dayKey, db, type Result } from '../db';
import { composeSession, type PlanItem } from './adaptive';

export interface DayPlan { minutes: number; items: PlanItem[] }

const key = () => `plan:${dayKey()}`;

/** Le plan du jour est figé à sa création (pour rester stable pendant la séance) ; changer de format le recalcule. */
export async function getOrCreatePlan(minutes?: number): Promise<DayPlan> {
  const row = await db.kv.get(key());
  const existing = row?.value as DayPlan | undefined;
  if (existing && (minutes === undefined || minutes === existing.minutes)) return existing;
  const settingsRow = await db.kv.get('settings');
  const m = minutes ?? (settingsRow?.value as { minutesPerDay?: number } | undefined)?.minutesPerDay ?? 20;
  const appResults = await db.results.where('source').equals('app').toArray();
  const plan: DayPlan = { minutes: m, items: composeSession(m, appResults) };
  await db.kv.put({ key: key(), value: plan });
  return plan;
}

export function doneToday(results: Result[]): Set<string> {
  const today = dayKey();
  return new Set(results.filter((r) => r.source === 'app' && dayKey(r.date) === today).map((r) => r.exerciseId));
}

export function nextInPlan(plan: DayPlan | undefined, done: Set<string>): string | undefined {
  return plan?.items.find((i) => !done.has(i.exerciseId))?.exerciseId;
}
