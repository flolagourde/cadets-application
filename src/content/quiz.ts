import { type ExerciseDef, type Item, pick, shuffle } from '../exercises/types';
import { PASSAGES, VOCAB } from './english';
import { FICHES } from './fiches';
import { type Fiche, type Question, type Theme, THEMES } from './types';

/** Suivi par question : [nombre de passages, nombre de bonnes réponses]. */
export type QStats = Record<string, [seen: number, ok: number]>;

const frDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

/**
 * Choisit n questions : d'abord celles jamais vues, puis celles au plus faible taux de réussite.
 * Un quart du tirage reste aléatoire pour entretenir les questions déjà acquises.
 */
export function pickQuestions<T extends { id: string }>(all: T[], stats: QStats | undefined, n: number): T[] {
  const rate = (q: T) => {
    const s = stats?.[q.id];
    return !s || s[0] === 0 ? -1 : s[1] / s[0];
  };
  const ranked = shuffle(all).sort((a, b) => rate(a) - rate(b));
  const core = ranked.slice(0, Math.ceil(n * 0.75));
  const rest = shuffle(ranked.slice(core.length)).slice(0, n - core.length);
  return shuffle([...core, ...rest]);
}

function toItem(q: Question, asOf?: string, extra: Partial<Item> = {}): Item {
  const order = shuffle(q.choices.map((_, i) => i));
  return {
    qid: q.id,
    prompt: q.q,
    kind: 'choice',
    choices: order.map((i) => ({ label: q.choices[i] })),
    answer: String(order.indexOf(0)),
    explain: q.explain + (q.volatile && asOf ? ` Donnée relevée le ${frDate(asOf)}.` : ''),
    ...extra,
  };
}

const withFiche = (fiches: Fiche[]) => fiches.flatMap((f) => f.questions.map((q) => ({ ...q, asOf: f.asOf })));

function themeQuiz(theme: Theme): ExerciseDef {
  const bank = withFiche(FICHES.filter((f) => f.theme === theme));
  return {
    id: `quiz-${theme}`,
    name: `Quiz ${THEMES[theme]}`,
    category: 'aero',
    rules: `Dix questions tirées des fiches « ${THEMES[theme]} » de la bibliothèque. Les questions jamais vues ou ratées reviennent en priorité.`,
    estMinutes: 3,
    noLevel: true,
    targetMs: () => Number.POSITIVE_INFINITY,
    generate: (_l, stats) => pickQuestions(bank, stats, Math.min(10, bank.length)).map((q) => toItem(q, q.asOf)),
  };
}

export const QUIZ_THEMES: ExerciseDef[] = (Object.keys(THEMES) as Theme[]).map(themeQuiz);

/** Quiz d'une seule fiche, lancé depuis la bibliothèque. */
export function ficheQuiz(ficheId: string): ExerciseDef | undefined {
  const f = FICHES.find((x) => x.id === ficheId);
  if (!f) return undefined;
  return {
    id: `fiche:${f.id}`,
    name: `Quiz : ${f.title}`,
    category: 'aero',
    rules: 'Toutes les questions de la fiche, dans un ordre aléatoire.',
    estMinutes: 3,
    noLevel: true,
    targetMs: () => Number.POSITIVE_INFINITY,
    generate: () => shuffle(f.questions).map((q) => toItem(q, f.asOf)),
  };
}

const vocabBank = VOCAB.map(([fr, en], i) => ({ id: `voc${i}`, fr, en }));

export const quizVocab: ExerciseDef = {
  id: 'en-vocab',
  name: 'Vocabulaire aéronautique',
  category: 'anglais',
  rules: 'Quinze termes à traduire, du français vers l’anglais ou l’inverse. Les termes ratés reviennent en priorité.',
  estMinutes: 2,
  noLevel: true,
  targetMs: () => Number.POSITIVE_INFINITY,
  generate: (_l, stats) =>
    pickQuestions(vocabBank, stats, 15).map((v): Item => {
      const toEn = Math.random() < 0.6;
      const others = shuffle(vocabBank.filter((o) => o.id !== v.id)).slice(0, 3);
      const options = shuffle([v, ...others]);
      return {
        qid: v.id,
        prompt: toEn ? v.fr : v.en,
        sub: toEn ? 'En anglais ?' : 'En français ?',
        kind: 'choice',
        choices: options.map((o) => ({ label: toEn ? o.en : o.fr })),
        answer: String(options.indexOf(v)),
        explain: `${v.fr} = ${v.en}`,
      };
    }),
};

export const quizReading: ExerciseDef = {
  id: 'en-reading',
  name: 'Compréhension écrite',
  category: 'anglais',
  rules: 'Un texte en anglais et six questions. Le texte reste affiché. Tu as 45 secondes par question, proche du rythme annoncé pour le psy0 (environ 45 questions en 30 minutes).',
  estMinutes: 4,
  noLevel: true,
  targetMs: () => Number.POSITIVE_INFINITY,
  generate: (_l, stats) => {
    // le texte le moins bien réussi (ou jamais lu) passe en premier
    const score = (id: string) => {
      const s = PASSAGES.find((p) => p.id === id)!.questions.map((q) => stats?.[q.id]);
      const seen = s.filter(Boolean) as [number, number][];
      return seen.length ? seen.reduce((a, x) => a + x[1] / Math.max(1, x[0]), 0) / seen.length : -1;
    };
    const min = Math.min(...PASSAGES.map((p) => score(p.id)));
    const passage = pick(PASSAGES.filter((p) => score(p.id) === min));
    return passage.questions.map((q) => toItem(q, undefined, { passage: passage.text, limitMs: 45000 }));
  },
};
