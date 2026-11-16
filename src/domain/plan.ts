import { dayKey, db, getSettings, type Result } from '../db';
import { composeExternal, composeSession, type PlanExt, type PlanItem } from './adaptive';
import { ensureCatalog } from './catalog';

export interface DayPlan { minutes: number; items: PlanItem[]; external?: PlanExt[] }

const key = () => `plan:${dayKey()}`;

/**
 * Le plan du jour est figé à sa création (pour rester stable pendant la séance).
 * Changer de format ou demander un recalcul (`force`) le reconstruit.
 */
export async function getOrCreatePlan(minutes?: number, force = false): Promise<DayPlan> {
  const row = await db.kv.get(key());
  const existing = row?.value as DayPlan | undefined;
  if (existing && !force && (minutes === undefined || minutes === existing.minutes)) return existing;
  await ensureCatalog();
  const settings = await getSettings();
  const m = minutes ?? existing?.minutes ?? settings.minutesPerDay;
  const all = await db.results.toArray();
  const now = new Date();
  const withComputer = settings.externalMinutes > 0 && settings.computerDays.includes(now.getDay());
  const plan: DayPlan = {
    minutes: m,
    items: composeSession(m, all.filter((r) => r.source === 'app'), now, settings.focusCategories),
    external: withComputer
      ? composeExternal(settings.externalMinutes, await db.extTests.toArray(), all.filter((r) => r.source !== 'app'), now)
      : [],
  };
  await db.kv.put({ key: key(), value: plan });
  return plan;
}

/** Identifiants des exercices (app) et des tests (plateformes) ayant un résultat aujourd'hui. */
export function doneToday(results: Result[]): Set<string> {
  const today = dayKey();
  return new Set(results.filter((r) => dayKey(r.date) === today).map((r) => r.exerciseId));
}

export function nextInPlan(plan: DayPlan | undefined, done: Set<string>): string | undefined {
  return plan?.items.find((i) => !done.has(i.exerciseId))?.exerciseId;
}
