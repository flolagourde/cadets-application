import type { CategoryId } from '../db';
import { attCompare, attSearch, attSwitch } from './attention';
import { calcEstimate, calcOps, calcPercent } from './calc';
import { logicSeries, spatialRotation } from './logic';
import { memNback, memSpan } from './memory';
import type { ExerciseDef } from './types';

/** Pour ajouter un exercice : écrire un ExerciseDef et l'inscrire ici. */
export const EXERCISE_LIST: ExerciseDef[] = [
  calcOps, calcPercent, calcEstimate,
  memSpan, memNback,
  attSearch, attCompare, attSwitch,
  logicSeries,
  spatialRotation,
];

export const EXERCISES: Record<string, ExerciseDef> = Object.fromEntries(EXERCISE_LIST.map((e) => [e.id, e]));

export const byCategory = (cat: CategoryId) => EXERCISE_LIST.filter((e) => e.category === cat);
