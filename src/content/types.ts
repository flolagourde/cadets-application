export interface SourceRef { title: string; url?: string }

/** Question à choix unique. La PREMIÈRE proposition est la bonne ; l'ordre est mélangé à l'affichage. */
export interface Question {
  id: string;
  q: string;
  choices: string[];
  explain: string;
  /** Donnée susceptible de changer : la date de relevé est rappelée dans la correction. */
  volatile?: boolean;
}

export type Theme = 'airfrance' | 'industrie' | 'technique';

export const THEMES: Record<Theme, string> = {
  airfrance: 'Air France',
  industrie: 'Institutions et sélection',
  technique: 'Repères techniques',
};

export interface Fiche {
  id: string;
  theme: Theme;
  title: string;
  /** Date à laquelle les données ont été relevées et recoupées (AAAA-MM-JJ). */
  asOf: string;
  intro?: string;
  sections: { title: string; points: string[] }[];
  /** Points que les sources ne permettent pas de trancher, ou à revérifier. */
  caveats?: string[];
  sources: SourceRef[];
  questions: Question[];
}
