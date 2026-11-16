import { db, type ExtTest, type Stage } from '../db';

/**
 * Catalogue de départ : tests listés publiquement par Pilotest pour les sélections Cadets Air France.
 * Relevé le 16/11/2026 sur :
 *  - https://www.pilotest.com/en/selections/preparez-les-tests-psychotechniques-et-psychomoteurs-des-selections-pilotes-cadets-air-france
 *  - https://www.pilotest.com/en/selections/preparez-la-preselection-pilotes-cadets-air-france
 * Seuls les noms, le classement par aptitude et les durées publiées sont repris : aucun contenu de test.
 * Le programme change d'une session à l'autre : le catalogue reste modifiable dans l'app.
 */
export const CATALOG_DATE = '2026-11-16';

type Seed = [slug: string, name: string, aptitudes: string[], minutes?: number];

const PSY1: Seed[] = [
  ['efg', 'EFG', ['Intellectuelle'], 30],
  ['francais', 'Lecture de textes', ['Intellectuelle', 'Verbale']],
  ['apm', 'Matrices de Raven', ['Intellectuelle'], 20],
  ['number_sequences', 'Suites numériques', ['Intellectuelle']],
  ['calcul_mental1', 'Calcul mental 1', ['Numérique']],
  ['calcul_mental2', 'Calcul mental 2', ['Numérique']],
  ['calcul_mental3', 'Calcul mental 3', ['Numérique'], 15],
  ['calcul_mental4', 'Calcul mental 4', ['Numérique'], 4],
  ['working_memory1', 'Mémoire de travail I', ['Attention', 'Mémorisation']],
  ['working_memory2', 'Mémoire de travail II', ['Numérique', 'Mémorisation']],
  ['compteurs', 'Test des compteurs', ['Numérique', 'Attention'], 10],
  ['angles2', 'Angles à saisir', ['Attention', 'Spatiale']],
  ['changing_matrix', 'Matrice changeante', ['Attention', 'Mémorisation']],
  ['psychomot', 'Psychomoteur ENAC', ['Psychomoteur']],
  ['cubes_psy1_cadets', 'Patrons de cubes - psy1 - Cadets AF', ['Spatiale']],
  ['room_rotation', 'Pièce 3D (rotations)', ['Spatiale', 'Mémorisation']],
];

const PSY0: Seed[] = [
  ['dominos', 'Dominos', ['Numérique', 'Intellectuelle']],
  ['grille_calculs', 'Grilles de calculs', ['Numérique']],
  ['pair_ou_impair', 'Pair ou impair', ['Numérique', 'Attention', 'Spatiale']],
  ['airways', 'Airways', ['Attention', 'Intellectuelle']],
  ['formes', 'Formes et couleurs', ['Attention']],
  ['m2back_color', 'Memory 2 Back couleurs', ['Attention', 'Mémorisation']],
  ['psychomot0', 'Psychomoteur psy0 AF cadet', ['Psychomoteur', 'Attention']],
  ['billes', 'Billes', ['Spatiale', 'Intellectuelle']],
  ['cubes_psy0', 'Cubes 2D/3D - psy0 Air France', ['Spatiale']],
  ['formes_glissees2', 'Formes glissées - II', ['Spatiale', 'Intellectuelle']],
  ['objets3d', 'Objets 3D', ['Spatiale']],
  ['boxes', 'Boîtes à mots', ['Verbale']],
  ['english', 'Anglais présélection cadets Air France', ['Anglais'], 30],
  ['culture_generale_aero_cadet_air_france', 'Culture aéronautique psy0 cadets Air France', ['Connaissances aéronautiques']],
];

const toTest = (stage: Stage) => ([slug, name, aptitudes, minutes]: Seed): ExtTest => ({
  id: `pilotest:${slug}`, source: 'pilotest', name, stage, aptitudes, minutes, target: 6, weak: false, active: true,
});

export const SEED: ExtTest[] = [...PSY1.map(toTest('psy1')), ...PSY0.map(toTest('psy0'))];

/** Ajoute les tests du catalogue absents de la base, sans toucher aux réglages déjà faits par l'utilisateur. */
export async function ensureCatalog(): Promise<void> {
  const existing = new Set(await db.extTests.toCollection().primaryKeys());
  const missing = SEED.filter((t) => !existing.has(t.id));
  if (missing.length) await db.extTests.bulkAdd(missing);
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
