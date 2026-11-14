import { dayKey, type LevelState, type Result } from '../db';
import { EXERCISE_LIST } from '../exercises/registry';
import { type ExerciseDef, MAX_LEVEL } from '../exercises/types';

/**
 * Règles d'adaptation (volontairement simples et explicables) :
 * - on ne change jamais de niveau sur une seule séance : il faut 2 séances concordantes au même niveau ;
 * - montée : précision ≥ 85 % ET temps médian ≤ temps cible, deux fois de suite ;
 * - descente : précision < 60 % deux fois de suite ;
 * - sinon maintien, avec la raison affichée à l'utilisateur.
 */
export const UP_ACC = 0.85;
export const DOWN_ACC = 0.6;

export const accuracy = (r: Result) => (r.total ? (r.correct ?? 0) / r.total : 0);

export interface LevelDecision { level: number; reason: string }

/** `history` : résultats de CET exercice, du plus récent au plus ancien (séance du jour incluse). */
export function decideLevel(def: ExerciseDef, level: number, history: Result[]): LevelDecision {
  const run: Result[] = [];
  for (const r of history) {
    if (r.level !== level) break;
    run.push(r);
  }
  const target = def.targetMs(level);
  const pct = (r: Result) => `${Math.round(accuracy(r) * 100)} %`;
  const sec = (ms: number) => `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
  if (run.length < 2) {
    return { level, reason: 'Une seule séance à ce niveau : il en faut deux concordantes avant tout changement.' };
  }
  const [a, b] = run;
  const fastEnough = (r: Result) => !Number.isFinite(target) || (r.medianMs ?? Infinity) <= target;
  if (accuracy(a) >= UP_ACC && accuracy(b) >= UP_ACC) {
    if (fastEnough(a) && fastEnough(b)) {
      if (level >= MAX_LEVEL) return { level, reason: 'Niveau maximal atteint et maîtrisé : passage en entretien.' };
      return { level: level + 1, reason: `Deux séances de suite ≥ 85 % (${pct(b)}, ${pct(a)}) dans le temps cible : niveau ${level + 1}.` };
    }
    return {
      level,
      reason: `Précision acquise (${pct(a)}) mais temps médian ${sec(a.medianMs ?? 0)} au-dessus de la cible ${sec(target)} : même niveau, objectif vitesse.`,
    };
  }
  if (accuracy(a) < DOWN_ACC && accuracy(b) < DOWN_ACC) {
    if (level <= 1) return { level, reason: 'Deux séances sous 60 % au niveau 1 : on consolide ce niveau.' };
    return { level: level - 1, reason: `Deux séances de suite sous 60 % (${pct(b)}, ${pct(a)}) : retour au niveau ${level - 1} pour consolider.` };
  }
  return { level, reason: `Résultats récents entre 60 % et 85 % ou irréguliers (${pct(b)}, ${pct(a)}) : niveau maintenu.` };
}

export interface ExerciseStats {
  sessions: number;
  /** Précision récente : moyenne pondérée des 5 dernières séances (la plus récente pèse le plus). */
  recentAcc: number | null;
  lastDate: string | null;
  daysSince: number | null;
}

export function exerciseStats(history: Result[], now = new Date()): ExerciseStats {
  if (!history.length) return { sessions: 0, recentAcc: null, lastDate: null, daysSince: null };
  const last5 = history.slice(0, 5);
  let w = 1, sum = 0, tot = 0;
  for (const r of last5) { sum += accuracy(r) * w; tot += w; w *= 0.6; }
  const daysSince = Math.floor((new Date(dayKey(now)).getTime() - new Date(dayKey(history[0].date)).getTime()) / 86400000);
  return { sessions: history.length, recentAcc: sum / tot, lastDate: history[0].date, daysSince };
}

export interface PlanItem { exerciseId: string; reason: string }

/**
 * Compose la séance du jour pour un budget en minutes.
 * Score de priorité = 0,55 × besoin (1 − précision récente) + 0,45 × ancienneté (jours sans pratique, plafonnée à 7),
 * puis pénalité de diversité (× 0,6 par exercice déjà retenu dans la même catégorie).
 * Un exercice jamais pratiqué reçoit besoin = 0,6 et ancienneté = 1 (séance de calibrage).
 */
export function composeSession(minutes: number, appResults: Result[], now = new Date()): PlanItem[] {
  const byEx = new Map<string, Result[]>();
  for (const r of [...appResults].sort((x, y) => y.date.localeCompare(x.date))) {
    if (!byEx.has(r.exerciseId)) byEx.set(r.exerciseId, []);
    byEx.get(r.exerciseId)!.push(r);
  }
  const candidates = EXERCISE_LIST.map((def) => {
    const st = exerciseStats(byEx.get(def.id) ?? [], now);
    const need = st.recentAcc === null ? 0.6 : 1 - st.recentAcc;
    const stale = st.daysSince === null ? 1 : Math.min(st.daysSince, 7) / 7;
    let reason: string;
    if (st.recentAcc === null) reason = 'Jamais travaillé : séance de calibrage.';
    else if (0.55 * need >= 0.45 * stale)
      reason = `Précision récente ${Math.round(st.recentAcc * 100)} % : à renforcer.`;
    else reason = `Pas travaillé depuis ${st.daysSince} jour${(st.daysSince ?? 0) > 1 ? 's' : ''} : entretien.`;
    return { def, score: 0.55 * need + 0.45 * stale, reason };
  });
  const plan: PlanItem[] = [];
  const perCat = new Map<string, number>();
  let budget = minutes;
  const pool = [...candidates];
  while (pool.length && budget > 0) {
    pool.sort((a, b) =>
      b.score * 0.6 ** (perCat.get(b.def.category) ?? 0) - a.score * 0.6 ** (perCat.get(a.def.category) ?? 0)
      || a.def.id.localeCompare(b.def.id));
    const best = pool.shift()!;
    if (best.def.estMinutes > budget && plan.length) break;
    plan.push({ exerciseId: best.def.id, reason: best.reason });
    perCat.set(best.def.category, (perCat.get(best.def.category) ?? 0) + 1);
    budget -= best.def.estMinutes;
  }
  return plan;
}

export function levelOf(levels: LevelState[] | undefined, exerciseId: string): number {
  return levels?.find((l) => l.exerciseId === exerciseId)?.level ?? 1;
}

/** Nombre de jours consécutifs (jusqu'à aujourd'hui ou hier) avec au moins une séance. */
export function streak(results: Result[], now = new Date()): number {
  const days = new Set(results.map((r) => dayKey(r.date)));
  const d = new Date(now);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
