import Dexie, { type Table } from 'dexie';

/** Domaines de compétence suivis par l'application. */
export type CategoryId = 'calcul' | 'memoire' | 'attention' | 'logique' | 'spatial';

export const CATEGORIES: Record<CategoryId, string> = {
  calcul: 'Calcul mental',
  memoire: 'Mémoire',
  attention: 'Attention',
  logique: 'Raisonnement logique',
  spatial: 'Capacités spatiales',
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
}

export interface LevelState {
  exerciseId: string;
  level: number;
  changedAt?: string;
  reason?: string;
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
  lastBackupAt?: string;
}

export const DEFAULT_SETTINGS: Settings = { daysPerWeek: 6, minutesPerDay: 20, restDays: [0] };

class CapDB extends Dexie {
  results!: Table<Result, number>;
  levels!: Table<LevelState, string>;
  kv!: Table<KV, string>;

  constructor() {
    super('cap-cadets');
    this.version(1).stores({
      results: '++id, date, source, exerciseId, category',
      levels: 'exerciseId',
      kv: 'key',
    });
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
