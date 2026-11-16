import type { CategoryId } from '../db';

/** Figure sur grille : true = case pleine. */
export type Figure = boolean[][];

/** Case d'une matrice logique : forme, nombre, remplissage et taille valent chacun 0, 1 ou 2. */
export interface Cell { shape: number; count: number; fill: number; size: number }

/** Cadran à aiguille gradué de 0 à 9 : position de l'aiguille (0 à 10) et sens de graduation. */
export interface DialSpec { pos: number; ccw: boolean }

export interface Choice {
  label?: string;
  figure?: Figure;
  cell?: Cell;
}

export interface Item {
  /** Identifiant de question (banques de quiz) : sert au suivi des questions ratées. */
  qid?: string;
  /** Texte de référence affiché au-dessus de la question (compréhension écrite). */
  passage?: string;
  prompt: string;
  sub?: string;
  /** Affichage : grand caractère (stimulus), grille de symboles, paire à comparer, figure. */
  big?: boolean;
  grid?: string[][];
  pair?: [string, string];
  figure?: Figure;
  /** Lignes d'énoncé affichées l'une sous l'autre (équations, listes). */
  lines?: string[];
  dials?: DialSpec[];
  /** Les 8 premières cases d'une matrice 3 × 3 ; la neuvième est à trouver. */
  matrix?: Cell[];
  tint?: 'blue' | 'amber';
  /** Stimulus seulement observé (non noté), avance automatiquement. */
  observeMs?: number;
  /** Phase de mémorisation avant la réponse (non chronométrée). */
  memorize?: { tokens: string[]; perTokenMs: number };
  /** multi : plusieurs propositions à cocher ; réponse = indices triés séparés par des virgules, ou 'none'. */
  kind: 'numeric' | 'choice' | 'multi' | 'none';
  /** numeric : la réponse peut être négative (touche ± au pavé). */
  signed?: boolean;
  /** multi : proposer le bouton « Aucun ». */
  allowNone?: boolean;
  choices?: Choice[];
  /** Réponse attendue : nombre (numeric), chaîne exacte (digits) ou index du choix. */
  answer: string;
  /** numeric : comparer comme nombre (défaut) ou comme suite de chiffres exacte. */
  exact?: boolean;
  /** Temps limite de réponse ; dépassement = erreur. */
  limitMs?: number;
  explain: string;
}

export interface ExerciseDef {
  id: string;
  name: string;
  category: CategoryId;
  rules: string;
  estMinutes: number;
  /** Temps médian cible par item pour considérer le niveau comme acquis. */
  targetMs: (level: number) => number;
  /** Retours visuels courts (tâches de cadence). */
  fast?: boolean;
  /** Quiz de connaissances : pas de niveau de difficulté, suivi par question. */
  noLevel?: boolean;
  /** Durée fixe en secondes : la séance s'arrête au bout du temps, quel que soit le nombre d'items traités. */
  timeLimitS?: number;
  generate: (level: number, stats?: Record<string, [number, number]>) => Item[];
}

export const MAX_LEVEL = 10;

export const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/** Interpolation entière entre le niveau 1 et le niveau 10. */
export const lerp = (level: number, from: number, to: number) =>
  Math.round(from + ((to - from) * (level - 1)) / (MAX_LEVEL - 1));
