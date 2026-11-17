import { DAILY, DAILY_THEMES, type DailyFact } from '../content/daily';
import { dayKey, db } from '../db';
import { type ExerciseDef, type Item, shuffle } from '../exercises/types';
import { dueIds, type Srs, srsUpdate } from './bia';

/**
 * Le fait du jour.
 * - Un fait nouveau par jour, dans l'ordre du lot. Un jour manqué n'est pas perdu : on reprend au suivant non lu.
 * - Deux questions sur le fait du jour, puis jusqu'à trois rappels de faits passés, en révisions espacées
 *   (1, 3, 7, 14 puis 30 jours ; une erreur ramène la question au lendemain).
 */

const LOG_KEY = 'daily:log';
const SRS_KEY = 'daily:srs';
export const MAX_REVIEWS_IN_DAILY = 3;
export const MAX_REVIEWS_ALONE = 10;

/** Faits terminés : identifiant → jour (AAAA-MM-JJ). */
export type DailyLog = Record<string, string>;

export async function loadDailyLog(): Promise<DailyLog> {
  return ((await db.kv.get(LOG_KEY))?.value as DailyLog | undefined) ?? {};
}
export async function loadDailySrs(): Promise<Srs> {
  return ((await db.kv.get(SRS_KEY))?.value as Srs | undefined) ?? {};
}

export interface DailyState {
  /** Fait à travailler ou déjà travaillé aujourd'hui ; null quand le lot est terminé. */
  fact: DailyFact | null;
  doneToday: boolean;
  /** Rang du fait dans le lot (1 à N). */
  rank: number;
  total: number;
  doneCount: number;
}

export function dailyState(log: DailyLog, now = new Date(), facts = DAILY): DailyState {
  const today = dayKey(now);
  const doneCount = facts.filter((f) => log[f.id]).length;
  const todays = facts.find((f) => log[f.id] === today);
  if (todays) return { fact: todays, doneToday: true, rank: facts.indexOf(todays) + 1, total: facts.length, doneCount };
  const next = facts.find((f) => !log[f.id]) ?? null;
  return { fact: next, doneToday: false, rank: next ? facts.indexOf(next) + 1 : facts.length, total: facts.length, doneCount };
}

const byQid = new Map(DAILY.flatMap((f) => f.questions.map((qq) => [qq.id, { fact: f, question: qq }] as const)));

/** Questions de rappel dues aujourd'hui, limitées aux faits déjà vus et existant encore dans les contenus. */
export function dueDailyQids(srs: Srs, log: DailyLog, now = new Date(), exceptFact?: string): string[] {
  return dueIds(srs, now).filter((id) => {
    const hit = byQid.get(id);
    return hit && log[hit.fact.id] && hit.fact.id !== exceptFact;
  });
}

const frDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

function toItem(fact: DailyFact, qq: DailyFact['questions'][number], tag: string): Item {
  const order = shuffle(qq.choices.map((_, i) => i));
  return {
    qid: qq.id,
    tag,
    prompt: qq.q,
    sub: tag === 'Rappel' ? `Rappel · ${fact.title}` : undefined,
    kind: 'choice',
    choices: order.map((i) => ({ label: qq.choices[i] })),
    answer: String(order.indexOf(0)),
    explain: qq.explain + (qq.volatile ? ` Donnée vérifiée le ${frDate(fact.asOf)}.` : ''),
  };
}

const base = {
  category: 'culture' as const,
  noLevel: true,
  targetMs: () => Number.POSITIVE_INFINITY,
};

/**
 * Exercices du fait du jour :
 * - `daily:<id>` : les deux questions du fait, puis les rappels dus (trois au plus) ;
 * - `daily:review` : les rappels dus seuls (dix au plus).
 */
export function dailyExercise(id: string, srs: Srs, log: DailyLog, now = new Date()): ExerciseDef | undefined {
  const arg = id.slice('daily:'.length);
  if (arg === 'review') {
    const due = shuffle(dueDailyQids(srs, log, now)).slice(0, MAX_REVIEWS_ALONE);
    return {
      ...base, id: 'daily:review', name: 'Fait du jour · rappels', estMinutes: Math.max(1, Math.round(due.length * 0.4)),
      rules: due.length ? `${due.length} question${due.length > 1 ? 's' : ''} sur des faits déjà vus, à revoir aujourd’hui.` : 'Aucun rappel dû aujourd’hui.',
      generate: () => due.map((qid) => { const h = byQid.get(qid)!; return toItem(h.fact, h.question, 'Rappel'); }),
    };
  }
  const fact = DAILY.find((f) => f.id === arg);
  if (!fact) return undefined;
  const due = shuffle(dueDailyQids(srs, log, now, fact.id)).slice(0, MAX_REVIEWS_IN_DAILY);
  return {
    ...base, id: `daily:${fact.id}`, name: `Fait du jour · ${fact.title}`, estMinutes: 2,
    rules: `Deux questions sur « ${fact.title} »${due.length ? `, puis ${due.length} rappel${due.length > 1 ? 's' : ''} de faits déjà vus` : ''}. Correction après chaque réponse.`,
    generate: () => [...shuffle(fact.questions).map((qq) => toItem(fact, qq, DAILY_THEMES[fact.theme])),
      ...due.map((qid) => { const h = byQid.get(qid)!; return toItem(h.fact, h.question, 'Rappel'); })],
  };
}

/** Enregistre une séance : rappels espacés pour chaque question, et fait marqué comme terminé (une seule fois). */
export async function recordDaily(exerciseId: string, answers: { qid: string; ok: boolean }[], now = new Date()): Promise<void> {
  let srs = await loadDailySrs();
  for (const a of answers) srs = srsUpdate(srs, a.qid, a.ok, now);
  await db.kv.put({ key: SRS_KEY, value: srs });
  const factId = exerciseId.slice('daily:'.length);
  if (factId !== 'review' && DAILY.some((f) => f.id === factId)) {
    const log = await loadDailyLog();
    if (!log[factId]) await db.kv.put({ key: LOG_KEY, value: { ...log, [factId]: dayKey(now) } });
  }
}

/** Jours consécutifs avec un fait du jour terminé (aujourd'hui ou hier compris). */
export function dailyStreak(log: DailyLog, now = new Date()): number {
  const days = new Set(Object.values(log));
  let n = 0;
  const d = new Date(now);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
