import { dayKey, db, type Result } from '../db';
import { pickQuestions, type QStats } from '../content/quiz';
import { type ExerciseDef, type Item, shuffle } from '../exercises/types';

/**
 * Module BIA. Les contenus (fiches, questions) ne sont PAS dans le code : ils arrivent dans un
 * « pack » importé par l'utilisateur et stocké sur l'appareil. Importer un pack de même identifiant
 * fusionne ses chapitres avec ceux déjà présents (les chapitres de même id sont remplacés).
 */
export type Origin = 'livret' | 'externe';

export interface BiaQuestion {
  id: string;
  /** Énoncé ; la PREMIÈRE proposition est la bonne (mélangée à l'affichage). */
  q: string;
  choices: string[];
  explain: string;
  /** Page du livret qui justifie la réponse. */
  page?: number;
  /** 'livret' : justifiable par le livret. 'externe' : complément, avec sa référence dans `ref`. */
  origin: Origin;
  ref?: string;
}

export interface BiaSection { title: string; points: string[]; origin?: Origin; ref?: string }

export interface BiaPart {
  id: string;
  title: string;
  pages: [number, number];
  sections: BiaSection[];
  /** Incohérences, ambiguïtés ou données datées relevées dans le livret. */
  notes?: string[];
  questions: BiaQuestion[];
}

export interface BiaChapter { id: string; title: string; parts: BiaPart[] }

export interface BiaPack {
  format: 'cap-cadets-bia';
  version: 1;
  id: string;
  title: string;
  source: string;
  generatedAt: string;
  chapters: BiaChapter[];
}

const KEY = 'bia:pack';
const SRS_KEY = 'bia:srs';
const READ_KEY = 'bia:read';

export function validatePack(obj: unknown): BiaPack {
  const p = obj as BiaPack;
  if (!p || p.format !== 'cap-cadets-bia') throw new Error('Ce fichier n’est pas un pack BIA Cap Cadets.');
  if (p.version !== 1) throw new Error('Version de pack non prise en charge : mets l’application à jour.');
  if (!Array.isArray(p.chapters) || !p.chapters.length) throw new Error('Le pack ne contient aucun chapitre.');
  const ids = new Set<string>();
  for (const c of p.chapters) {
    if (!c.id || !c.title || !Array.isArray(c.parts)) throw new Error('Chapitre mal formé dans le pack.');
    for (const part of c.parts) {
      if (!part.id || !part.title || !Array.isArray(part.questions) || !Array.isArray(part.sections)) {
        throw new Error(`Partie mal formée dans « ${c.title} ».`);
      }
      for (const q of part.questions) {
        if (!q.id || !q.q || !Array.isArray(q.choices) || q.choices.length < 2 || !q.explain) {
          throw new Error(`Question mal formée dans « ${part.title} ».`);
        }
        if (new Set(q.choices).size !== q.choices.length) throw new Error(`Propositions en double (question ${q.id}).`);
        if (ids.has(q.id)) throw new Error(`Identifiant de question en double : ${q.id}.`);
        ids.add(q.id);
      }
    }
  }
  return p;
}

export async function loadPack(): Promise<BiaPack | null> {
  return ((await db.kv.get(KEY))?.value as BiaPack | undefined) ?? null;
}

/** Importe un pack. Renvoie le pack résultant et le nombre de chapitres ajoutés ou remplacés. */
export async function importPack(text: string): Promise<{ pack: BiaPack; chapters: number; questions: number }> {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('Fichier illisible : ce n’est pas du JSON valide.'); }
  const incoming = validatePack(parsed);
  const current = await loadPack();
  let merged = incoming;
  if (current && current.id === incoming.id) {
    const byId = new Map(current.chapters.map((c) => [c.id, c]));
    for (const c of incoming.chapters) byId.set(c.id, c);
    merged = { ...incoming, chapters: [...byId.values()].sort((a, b) => a.id.localeCompare(b.id)) };
    validatePack(merged); // identifiants de questions toujours uniques après fusion
  }
  await db.kv.put({ key: KEY, value: merged });
  return {
    pack: merged,
    chapters: incoming.chapters.length,
    questions: incoming.chapters.reduce((s, c) => s + c.parts.reduce((t, p) => t + p.questions.length, 0), 0),
  };
}

export async function removePack(): Promise<void> {
  await db.kv.delete(KEY);
}

export const allParts = (pack: BiaPack) => pack.chapters.flatMap((c) => c.parts.map((part) => ({ chapter: c, part })));
export const findPart = (pack: BiaPack, partId: string) => allParts(pack).find((x) => x.part.id === partId);

// --- Révision espacée (boîtes de Leitner) -------------------------------------

/** Intervalle en jours avant la prochaine révision, selon la boîte (1 à 5). */
export const LEITNER_DAYS = [1, 3, 7, 14, 30];
export type Srs = Record<string, { box: number; due: string }>;

export async function loadSrs(): Promise<Srs> {
  return ((await db.kv.get(SRS_KEY))?.value as Srs | undefined) ?? {};
}

const addDays = (n: number, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return dayKey(d); };

/** Bonne réponse : boîte suivante. Erreur : retour en boîte 1, à revoir demain. */
export function srsUpdate(srs: Srs, qid: string, ok: boolean, now = new Date()): Srs {
  const box = ok ? Math.min(5, (srs[qid]?.box ?? 0) + 1) : 1;
  return { ...srs, [qid]: { box, due: addDays(LEITNER_DAYS[box - 1], now) } };
}

export async function recordSrs(answers: { qid: string; ok: boolean }[]): Promise<void> {
  let srs = await loadSrs();
  for (const a of answers) srs = srsUpdate(srs, a.qid, a.ok);
  await db.kv.put({ key: SRS_KEY, value: srs });
}

export function dueIds(srs: Srs, now = new Date()): string[] {
  const today = dayKey(now);
  return Object.entries(srs).filter(([, v]) => v.due <= today).map(([id]) => id);
}

// --- Lecture des fiches et statut des parties ---------------------------------

export async function loadRead(): Promise<Record<string, string>> {
  return ((await db.kv.get(READ_KEY))?.value as Record<string, string> | undefined) ?? {};
}
export async function toggleRead(partId: string): Promise<void> {
  const r = await loadRead();
  if (r[partId]) delete r[partId]; else r[partId] = new Date().toISOString();
  await db.kv.put({ key: READ_KEY, value: r });
}

export type Status = 'none' | 'progress' | 'reviewed' | 'mastered';
export const STATUS_LABEL: Record<Status, string> = {
  none: 'Non commencé', progress: 'En cours', reviewed: 'Révisé', mastered: 'Maîtrisé',
};
export const MASTERY_ACC = 0.8;

/**
 * Statut d'une partie, calculé à partir des résultats (jamais de la seule lecture de la fiche) :
 *  - Maîtrisé : toutes les questions vues, et les 3 derniers questionnaires de la partie ≥ 80 %, passés sur au moins 2 jours différents ;
 *  - Révisé : fiche lue et toutes les questions vues au moins une fois ;
 *  - En cours : fiche lue ou au moins un questionnaire ;
 *  - Non commencé sinon.
 * `quizzes` : résultats des questionnaires de CETTE partie, du plus récent au plus ancien.
 */
export function partStatus(part: BiaPart, read: boolean, stats: QStats, quizzes: Result[]): Status {
  const allSeen = part.questions.length > 0 && part.questions.every((q) => (stats[q.id]?.[0] ?? 0) > 0);
  const last3 = quizzes.slice(0, 3);
  const steady = last3.length === 3
    && last3.every((r) => (r.total ? (r.correct ?? 0) / r.total : 0) >= MASTERY_ACC)
    && new Set(last3.map((r) => dayKey(r.date))).size >= 2;
  if (allSeen && steady) return 'mastered';
  if (allSeen && read) return 'reviewed';
  if (read || quizzes.length > 0) return 'progress';
  return 'none';
}

/** Taux de réussite cumulé sur les questions d'une partie (null si aucune réponse). */
export function partRate(part: BiaPart, stats: QStats): number | null {
  let seen = 0, ok = 0;
  for (const q of part.questions) { const s = stats[q.id]; if (s) { seen += s[0]; ok += s[1]; } }
  return seen ? ok / seen : null;
}

// --- Questionnaires -----------------------------------------------------------

/** Format officiel de l'épreuve obligatoire (vérifié sur le sujet 2025) : 5 parties de 20 questions, 2 h 30. */
export const EXAM = { perChapter: 20, secondsPerQuestion: 90 };

function toItem(q: BiaQuestion, tag: string): Item {
  const order = shuffle(q.choices.map((_, i) => i));
  const where = q.origin === 'externe' ? ` Complément hors livret${q.ref ? ` : ${q.ref}` : ''}.` : q.page ? ` Livret p. ${q.page}.` : '';
  return {
    qid: q.id,
    tag,
    prompt: q.q,
    kind: 'choice',
    choices: order.map((i) => ({ label: q.choices[i] })),
    answer: String(order.indexOf(0)),
    explain: q.explain + where,
  };
}

const base = { category: 'bia' as const, noLevel: true, targetMs: () => Number.POSITIVE_INFINITY };

/**
 * Résout un identifiant de questionnaire BIA :
 *  bia:part:<id> (15 questions de la partie), bia:chap:<id> (20 questions de la matière),
 *  bia:all (20 questions au hasard), bia:due (révisions dues), bia:exam (examen blanc).
 */
export function biaExercise(id: string, pack: BiaPack | null, srs: Srs): ExerciseDef | undefined {
  if (!pack) return undefined;
  const [, mode, arg] = id.split(':');
  const tagged = (parts: { chapter: BiaChapter; part: BiaPart }[]) =>
    parts.flatMap(({ chapter, part }) => part.questions.map((q) => ({ ...q, tag: chapter.title })));
  if (mode === 'part') {
    const found = findPart(pack, arg);
    if (!found) return undefined;
    const bank = tagged([found]);
    return {
      ...base, id, name: `BIA · ${found.part.title}`, estMinutes: 5,
      rules: `Jusqu’à 15 questions sur cette partie (${bank.length} dans la banque). Les questions jamais vues ou ratées passent en premier.`,
      generate: (_l, stats) => pickQuestions(bank, stats, Math.min(15, bank.length)).map((q) => toItem(q, q.tag)),
    };
  }
  if (mode === 'chap') {
    const chapter = pack.chapters.find((c) => c.id === arg);
    if (!chapter) return undefined;
    const bank = tagged(chapter.parts.map((part) => ({ chapter, part })));
    return {
      ...base, id, name: `BIA · ${chapter.title}`, estMinutes: 7,
      rules: `20 questions mêlant toutes les parties de cette matière (${bank.length} dans la banque).`,
      generate: (_l, stats) => pickQuestions(bank, stats, Math.min(20, bank.length)).map((q) => toItem(q, q.tag)),
    };
  }
  const everything = tagged(allParts(pack));
  if (mode === 'all') {
    return {
      ...base, id, name: 'BIA · Questionnaire aléatoire', estMinutes: 7,
      rules: '20 questions tirées de toutes les matières importées.',
      generate: (_l, stats) => pickQuestions(everything, stats, Math.min(20, everything.length)).map((q) => toItem(q, q.tag)),
    };
  }
  if (mode === 'due') {
    const due = new Set(dueIds(srs));
    const bank = everything.filter((q) => due.has(q.id));
    if (!bank.length) return undefined;
    return {
      ...base, id, name: 'BIA · Révisions du jour', estMinutes: 5,
      rules: `${Math.min(20, bank.length)} questions arrivées à échéance. Une bonne réponse espace la prochaine révision (1, 3, 7, 14 puis 30 jours) ; une erreur la ramène au lendemain.`,
      generate: () => shuffle(bank).slice(0, 20).map((q) => toItem(q, q.tag)),
    };
  }
  if (mode === 'exam') {
    const perChapter = pack.chapters.map((c) => shuffle(tagged(c.parts.map((part) => ({ chapter: c, part })))).slice(0, EXAM.perChapter));
    const n = perChapter.reduce((s, x) => s + x.length, 0);
    const complete = pack.chapters.length >= 5 && perChapter.every((x) => x.length === EXAM.perChapter);
    return {
      ...base, id, name: complete ? 'BIA · Examen blanc' : 'BIA · Examen blanc partiel', estMinutes: Math.round((n * EXAM.secondsPerQuestion) / 60),
      silent: true,
      timeLimitS: n * EXAM.secondsPerQuestion,
      rules: `${n} questions, ${Math.round((n * EXAM.secondsPerQuestion) / 60)} minutes, aucune correction avant la fin. `
        + (complete
          ? 'Format officiel : 5 matières de 20 questions, 2 h 30.'
          : `Format officiel : 5 matières de 20 questions en 2 h 30. Ici, ${pack.chapters.length} matière${pack.chapters.length > 1 ? 's' : ''} importée${pack.chapters.length > 1 ? 's' : ''} : la durée est réduite en proportion.`),
      // matière par matière, comme le sujet officiel
      generate: () => perChapter.flatMap((qs) => qs.map((q) => toItem(q, q.tag))),
    };
  }
  return undefined;
}
