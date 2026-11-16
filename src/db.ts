import Dexie, { type Table } from 'dexie';

/** Domaines de compétence suivis par l'application. */
export type CategoryId = 'calcul' | 'memoire' | 'attention' | 'logique' | 'spatial' | 'aero' | 'anglais' | 'bia';

export const CATEGORIES: Record<CategoryId, string> = {
  calcul: 'Calcul mental',
  memoire: 'Mémoire',
  attention: 'Attention',
  logique: 'Raisonnement logique',
  spatial: 'Capacités spatiales',
  aero: 'Culture aéronautique',
  anglais: 'Anglais',
  bia: 'BIA',
};

/** Provenance d'un résultat : jamais mélangées dans les statistiques. */
export type Source = 'app' | 'pilotest' | 'epltest';

export const SOURCES: Record<Source, string> = {
  app: 'Cap Cadets',
  pilotest: 'Pilotest',
  epltest: 'EPL Test',
};

export interface ErrorItem {
  prompt: string;
  given: string;
  expected: string;
  explain: string;
}

export interface Result {
  id?: number;
  /** Date ISO complète (horodatage). */
  date: string;
  source: Source;
  exerciseId: string;
  exerciseName: string;
  category: CategoryId | 'autre';
  level?: number;
  correct?: number;
  wrong?: number;
  total?: number;
  /** Score en % : calculé pour l'app, saisi tel quel pour les plateformes. */
  scorePct?: number;
  /** Temps de réponse médian par item (app). */
  medianMs?: number;
  /** Durée totale en secondes. */
  durationS?: number;
  percentile?: number;
  stanine?: number;
  difficulty?: string;
  comment?: string;
  errors?: ErrorItem[];
  /** Détail par matière (examens blancs BIA) : [bonnes réponses, questions]. */
  breakdown?: Record<string, [number, number]>;
}

export interface LevelState {
  exerciseId: string;
  level: number;
  changedAt?: string;
  reason?: string;
}

export type Stage = 'psy0' | 'psy1' | 'autre';

export const STAGES: Record<Stage, string> = { psy1: 'PSY1', psy0: 'PSY0', autre: 'Mes tests' };

/** Test d'une plateforme externe (catalogue modifiable par l'utilisateur). */
export interface ExtTest {
  id: string;
  source: Exclude<Source, 'app'>;
  name: string;
  stage: Stage;
  /** Aptitudes telles que la plateforme les classe. */
  aptitudes: string[];
  /** Durée du test en minutes, quand elle est connue. */
  minutes?: number;
  /** Objectif personnel de stanine (1 à 9) : ce n'est pas un seuil officiel. */
  target: number;
  weak: boolean;
  active: boolean;
  custom?: boolean;
}

export interface KV {
  key: string;
  value: unknown;
}

export interface Settings {
  cadetsDate?: string;
  biaDate?: string;
  startDate?: string;
  daysPerWeek: number;
  minutesPerDay: number;
  restDays: number[]; // 0 = dimanche
  /** Minutes de travail sur plateforme prescrites les jours avec ordinateur (0 = désactivé). */
  externalMinutes: number;
  computerDays: number[];
  /** Domaines de l'app à renforcer (priorité × 1,3). */
  focusCategories: CategoryId[];
  lastBackupAt?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  daysPerWeek: 6, minutesPerDay: 20, restDays: [0],
  externalMinutes: 30, computerDays: [0, 1, 2, 3, 4, 5, 6], focusCategories: [],
};

class CapDB extends Dexie {
  results!: Table<Result, number>;
  levels!: Table<LevelState, string>;
  kv!: Table<KV, string>;
  extTests!: Table<ExtTest, string>;

  constructor() {
    super('cap-cadets');
    this.version(1).stores({
      results: '++id, date, source, exerciseId, category',
      levels: 'exerciseId',
      kv: 'key',
    });
    this.version(2).stores({ extTests: 'id, source, stage' });
  }
}

export const db = new CapDB();

export async function getSettings(): Promise<Settings> {
  const row = await db.kv.get('settings');
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await db.kv.put({ key: 'settings', value: { ...current, ...patch } });
}

/** Clé de jour locale AAAA-MM-JJ. */
export function dayKey(d: Date | string = new Date()): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}
