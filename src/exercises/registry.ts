import type { CategoryId } from '../db';
import { attCompare, attSearch, attSwitch } from './attention';
import { calcEstimate, calcOps, calcPercent } from './calc';
import { attDials, calcCascade, calcSigned, calcSprint, logicLaw, logicMatrix } from './critical';
import { logicSeries, spatialRotation } from './logic';
import { memNback, memSpan } from './memory';
import { ficheQuiz, QUIZ_THEMES, quizReading, quizVocab } from '../content/quiz';
import type { ExerciseDef } from './types';

/** Pour ajouter un exercice : écrire un ExerciseDef et l'inscrire ici. */
export const EXERCISE_LIST: ExerciseDef[] = [
  calcOps, calcSprint, calcCascade, calcSigned, calcPercent, calcEstimate,
  memSpan, memNback,
  attDials, attSearch, attCompare, attSwitch,
  logicLaw, logicMatrix, logicSeries,
  spatialRotation,
  ...QUIZ_THEMES,
  quizVocab, quizReading,
];

export const EXERCISES: Record<string, ExerciseDef> = Object.fromEntries(EXERCISE_LIST.map((e) => [e.id, e]));

export const byCategory = (cat: CategoryId) => EXERCISE_LIST.filter((e) => e.category === cat);

/** Exercice du registre, ou quiz d'une fiche de la bibliothèque (identifiant `fiche:<id>`). */
export function getExercise(id: string): ExerciseDef | undefined {
  return EXERCISES[id] ?? (id.startsWith('fiche:') ? ficheQuiz(id.slice(6)) : undefined);
}
