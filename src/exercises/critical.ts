import { type Cell, type DialSpec, type ExerciseDef, type Item, lerp, pick, rnd, shuffle } from './types';
import { opItemForSprint } from './calc';

/**
 * Exercices ciblant les aptitudes des tests jugés critiques (calcul en chaîne, sommes signées,
 * lecture de cadrans, recherche d'une loi, matrices). Formats originaux : ils entraînent la même
 * aptitude que les tests des plateformes sans en reprendre le contenu.
 */
const sgn = (n: number) => (n < 0 ? `−${-n}` : String(n));

// --- 1. Équations en cascade -------------------------------------------------

export function cascade(level: number): { lines: string[]; values: number[] } {
  const n = level >= 5 ? 4 : 3;
  const names = ['a', 'b', 'c', 'd'];
  const values: number[] = [rnd(2, 6 + level)];
  const lines = [`a = ${values[0]}`];
  for (let i = 1; i < n; i++) {
    const p = names[i - 1], pv = values[i - 1];
    const j = i >= 2 ? rnd(0, i - 2) : 0; // un paramètre plus ancien
    const q = names[j], qv = values[j];
    const forms = ['add', 'sub', 'rsub'];
    if (level >= 3 && Math.abs(pv) <= 30) forms.push('mul');
    if (level >= 5 && i >= 2) forms.push('sum2', 'diff2');
    if (level >= 7 && i >= 2) {
      if (Math.abs(pv + qv) <= 25) forms.push('paren');
      if (Math.abs(pv) <= 12 && Math.abs(qv) <= 12) forms.push('prod');
    }
    const f = pick(forms);
    const k = rnd(2, 5 + 2 * level), m = rnd(2, level >= 7 ? 6 : 4);
    let expr: string, v: number;
    if (f === 'add') { expr = `${p} + ${k}`; v = pv + k; }
    else if (f === 'sub') { expr = `${p} − ${k}`; v = pv - k; }
    else if (f === 'rsub') { expr = `${k} − ${p}`; v = k - pv; }
    else if (f === 'mul') { expr = `${m} × ${p}`; v = m * pv; }
    else if (f === 'sum2') { expr = `${p} + ${q}`; v = pv + qv; }
    else if (f === 'diff2') { expr = `${q} − ${p}`; v = qv - pv; }
    else if (f === 'paren') { expr = `${m} × (${p} + ${q})`; v = m * (pv + qv); }
    else { expr = `${p} × ${q}`; v = pv * qv; }
    values.push(v);
    lines.push(`${names[i]} = ${expr}`);
  }
  return { lines, values };
}

export const calcCascade: ExerciseDef = {
  id: 'calc-cascade',
  name: 'Équations en cascade',
  category: 'calcul',
  rules:
    'Chaque ligne se calcule à partir des précédentes. Saisis la valeur de la dernière lettre, de tête. La réponse peut être négative : touche ± du pavé.',
  estMinutes: 3,
  targetMs: (l) => lerp(l, 14000, 28000),
  generate: (level) =>
    Array.from({ length: 8 }, (): Item => {
      const c = cascade(level);
      const names = ['a', 'b', 'c', 'd'];
      const last = names[c.values.length - 1];
      return {
        prompt: `${last} = ?`,
        lines: c.lines,
        kind: 'numeric',
        signed: true,
        answer: String(c.values[c.values.length - 1]),
        explain: c.values.map((v, i) => `${names[i]} = ${sgn(v)}`).join(', ') + '.',
      };
    }),
};

// --- 2. Sommes signées et intervalles ----------------------------------------

export function signedSum(level: number): { terms: number[]; total: number } {
  const n = lerp(level, 4, 8);
  const terms = Array.from({ length: n }, () => rnd(lerp(level, 5, 20), lerp(level, 30, 99)) * (Math.random() < 0.5 ? -1 : 1));
  return { terms, total: terms.reduce((a, b) => a + b, 0) };
}

function signedItem(level: number): Item {
  const { terms, total } = signedSum(level);
  const w = lerp(level, 40, 16);
  const nGood = pick([0, 1, 1, 1, 2, 2, 3]);
  const intervals = new Map<string, boolean>();
  let guard = 0;
  while (intervals.size < 5 && guard++ < 200) {
    const good = [...intervals.values()].filter(Boolean).length < nGood;
    let lo: number;
    if (good) lo = total - rnd(0, w);
    else lo = Math.random() < 0.5 ? total - w - rnd(1, 9) : total + rnd(1, 9);
    intervals.set(`[${sgn(lo)} ; ${sgn(lo + w)}]`, lo <= total && total <= lo + w);
  }
  const list = shuffle([...intervals.entries()]);
  const right = list.map(([, ok], i) => (ok ? i : -1)).filter((i) => i >= 0);
  const expr = terms.map((t, i) => (i === 0 ? sgn(t) : `${t < 0 ? '−' : '+'} ${Math.abs(t)}`)).join(' ');
  return {
    prompt: expr,
    sub: 'Coche tous les intervalles qui contiennent le résultat (bornes incluses)',
    kind: 'multi',
    allowNone: true,
    choices: list.map(([label]) => ({ label })),
    answer: right.length ? right.join(',') : 'none',
    limitMs: lerp(level, 45000, 22000),
    explain: `Résultat : ${sgn(total)}. ${right.length ? `Intervalles corrects : ${right.map((i) => list[i][0]).join(', ')}.` : 'Aucun intervalle ne le contient.'}`,
  };
}

export const calcSigned: ExerciseDef = {
  id: 'calc-signed',
  name: 'Sommes signées',
  category: 'calcul',
  rules:
    'Additionne de tête une suite de nombres positifs et négatifs, puis coche tous les intervalles qui contiennent le résultat. Il peut y en avoir plusieurs, ou aucun. Le temps est limité.',
  estMinutes: 3,
  targetMs: (l) => lerp(l, 22000, 16000),
  generate: (level) => Array.from({ length: 8 }, () => signedItem(level)),
};

// --- 3. Lecture de cadrans ---------------------------------------------------

/** Chiffre lu sur un cadran : le dernier chiffre dépassé par l'aiguille. */
export const readDial = (d: DialSpec) => Math.floor(d.pos + 1e-9) % 10;

export function dialBoard(level: number): { dials: DialSpec[]; value: number } {
  const nd = level <= 3 ? 2 : level <= 6 ? 3 : 4;
  const value = rnd(10 ** (nd - 1), 10 ** nd - 1);
  const frac = 0.3 + Math.random() * 0.4;
  const digits = String(value).split('').map(Number);
  const dials = digits.map((d, i): DialSpec => {
    const k = nd - 1 - i;
    // niveaux élevés : aiguilles « continues », comme un vrai compteur (une aiguille proche d'un chiffre ne l'a pas forcément dépassé)
    const pos = level >= 7 ? ((value + frac) / 10 ** k) % 10 : d + 0.3 + Math.random() * 0.4;
    return { pos, ccw: level >= 3 && i % 2 === 1 };
  });
  return { dials, value };
}

function dialItem(level: number): Item {
  const { dials, value } = dialBoard(level);
  const nd = dials.length;
  const digits = String(value).split('').map(Number);
  const fmt = (ds: number[]) => ds.join('');
  const options = new Set<string>([fmt(digits)]);
  const wrongDir = digits.map((d, i) => (dials[i].ccw ? 9 - d : d));
  options.add(fmt(wrongDir));
  const candidates: number[][] = [];
  for (let i = 0; i < nd; i++) {
    candidates.push(digits.map((d, j) => (j === i ? (d + 1) % 10 : d)));
    candidates.push(digits.map((d, j) => (j === i ? (d + 9) % 10 : d)));
    if (i < nd - 1 && digits[i] !== digits[i + 1]) {
      const sw = [...digits]; [sw[i], sw[i + 1]] = [sw[i + 1], sw[i]]; candidates.push(sw);
    }
  }
  for (const c of shuffle(candidates)) if (options.size < 6) options.add(fmt(c));
  while (options.size < 6) options.add(fmt(digits.map(() => rnd(0, 9))));
  const list = shuffle([...options]);
  return {
    prompt: 'Quelle valeur indique le compteur ?',
    dials,
    kind: 'choice',
    choices: list.map((label) => ({ label })),
    answer: String(list.indexOf(fmt(digits))),
    limitMs: lerp(level, 30000, 12000),
    explain: `Valeur : ${fmt(digits)}. Sur chaque cadran, on lit le dernier chiffre dépassé par l’aiguille${dials.some((d) => d.ccw) ? ' ; attention aux cadrans gradués dans le sens inverse' : ''}.`,
  };
}

export const attDials: ExerciseDef = {
  id: 'att-dials',
  name: 'Lecture de cadrans',
  category: 'attention',
  rules:
    'Un compteur est formé de plusieurs cadrans, lus de gauche à droite. Sur chaque cadran, lis le dernier chiffre dépassé par l’aiguille. À partir du niveau 3, un cadran sur deux est gradué en sens inverse. À partir du niveau 7, les aiguilles avancent en continu comme sur un vrai compteur : une aiguille presque posée sur un chiffre ne l’a dépassé que si le cadran suivant vient de repasser par 0. Le temps est limité.',
  estMinutes: 3,
  targetMs: (l) => lerp(l, 9000, 7000),
  generate: (level) => Array.from({ length: 10 }, () => dialItem(level)),
};

// --- 4. Loi commune ----------------------------------------------------------

interface Law<T> { text: string; test: (x: T) => boolean; hard?: boolean }

const digitSum = (n: number) => String(n).split('').reduce((a, c) => a + Number(c), 0);
const isPrime = (n: number) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const isSquare = (n: number) => Number.isInteger(Math.sqrt(n));

export const NUMBER_LAWS: Law<number>[] = [
  { text: 'nombres pairs', test: (n) => n % 2 === 0 },
  { text: 'nombres impairs', test: (n) => n % 2 === 1 },
  { text: 'multiples de 5', test: (n) => n % 5 === 0 },
  { text: 'multiples de 3', test: (n) => n % 3 === 0 },
  { text: 'multiples de 4', test: (n) => n % 4 === 0 },
  { text: 'chiffre des unités égal à 7', test: (n) => n % 10 === 7 },
  { text: 'multiples de 6', test: (n) => n % 6 === 0, hard: true },
  { text: 'multiples de 7', test: (n) => n % 7 === 0, hard: true },
  { text: 'multiples de 9', test: (n) => n % 9 === 0, hard: true },
  { text: 'nombres premiers', test: isPrime, hard: true },
  { text: 'carrés parfaits', test: isSquare, hard: true },
  { text: 'somme des chiffres égale à 9', test: (n) => digitSum(n) === 9, hard: true },
  { text: 'somme des chiffres paire', test: (n) => digitSum(n) % 2 === 0, hard: true },
  { text: 'chiffre des dizaines plus grand que celui des unités', test: (n) => Math.floor(n / 10) % 10 > n % 10, hard: true },
  { text: 'deux chiffres identiques', test: (n) => Math.floor(n / 10) === n % 10, hard: true },
];

const WORDS = [
  'avion', 'piste', 'nuage', 'orage', 'hangar', 'cabine', 'moteur', 'helice', 'radar', 'balise', 'escale', 'ecran',
  'aile', 'train', 'carte', 'vent', 'pilote', 'copilote', 'altitude', 'vitesse', 'essence', 'atterrir', 'decoller',
  'boussole', 'uniforme', 'equipage', 'itineraire', 'horizon', 'tour', 'ciel', 'azur', 'ocean', 'ile', 'aube',
  'manche', 'volet', 'frein', 'soute', 'passerelle', 'terrasse', 'antenne', 'approche', 'commande', 'ballon', 'fusee',
];
const VOWELS = 'aeiouy';
export const WORD_LAWS: Law<string>[] = [
  { text: 'mots commençant par une voyelle', test: (w) => VOWELS.includes(w[0]) },
  { text: 'mots de cinq lettres', test: (w) => w.length === 5 },
  { text: 'mots finissant par « e »', test: (w) => w.endsWith('e') },
  { text: 'mots contenant une lettre doublée', test: (w) => /(.)\1/.test(w), hard: true },
  { text: 'mots de plus de six lettres', test: (w) => w.length > 6, hard: true },
  { text: 'mots contenant exactement deux voyelles', test: (w) => w.split('').filter((c) => VOWELS.includes(c)).length === 2, hard: true },
];

function lawItemFrom<T>(laws: Law<T>[], pool: T[], level: number): Item | null {
  const law = pick(laws.filter((l) => level >= 4 || !l.hard));
  const yes = shuffle(pool.filter(law.test)), no = shuffle(pool.filter((x) => !law.test(x)));
  const nGood = rnd(1, 4);
  if (yes.length < 3 + nGood || no.length < 3 + (6 - nGood)) return null;
  const options = shuffle([...yes.slice(3, 3 + nGood), ...no.slice(3, 9 - nGood)]);
  const right = options.map((o, i) => (law.test(o) ? i : -1)).filter((i) => i >= 0);
  return {
    prompt: 'Quels éléments suivent la loi ?',
    lines: [`Suivent la loi : ${yes.slice(0, 3).join(' · ')}`, `Ne la suivent pas : ${no.slice(0, 3).join(' · ')}`],
    kind: 'multi',
    choices: options.map((o) => ({ label: String(o) })),
    answer: right.join(','),
    limitMs: lerp(level, 75000, 40000),
    explain: `Loi : ${law.text}. Éléments corrects : ${right.map((i) => options[i]).join(', ')}.`,
  };
}

function lawItem(level: number): Item {
  for (;;) {
    const numbers = Array.from({ length: 90 }, (_, i) => i + 10);
    const item = Math.random() < 0.7 ? lawItemFrom(NUMBER_LAWS, numbers, level) : lawItemFrom(WORD_LAWS, WORDS, level);
    if (item) return item;
  }
}

export const logicLaw: ExerciseDef = {
  id: 'logic-law',
  name: 'Loi commune',
  category: 'logique',
  rules:
    'Trois éléments suivent une même loi, trois autres ne la suivent pas. Trouve la loi, puis coche parmi six propositions toutes celles qui la suivent : il y en a au moins une. Nombres ou mots (sans accents).',
  estMinutes: 4,
  targetMs: (l) => lerp(l, 30000, 25000),
  generate: (level) => Array.from({ length: 8 }, () => lawItem(level)),
};

// --- 5. Matrices -------------------------------------------------------------

const ATTRS = ['shape', 'count', 'fill', 'size'] as const;
type Attr = (typeof ATTRS)[number];
const ATTR_NAMES: Record<Attr, string> = { shape: 'Forme', count: 'Nombre', fill: 'Remplissage', size: 'Taille' };
type Rule = 'const' | 'row' | 'col' | 'latin';
const RULE_TEXT: Record<Rule, string> = {
  const: 'identique partout',
  row: 'identique sur une même ligne, différent d’une ligne à l’autre',
  col: 'change de la même façon le long de chaque ligne',
  latin: 'les trois valeurs apparaissent une fois par ligne et par colonne',
};

export function buildMatrix(level: number): { cells: Cell[]; rules: Record<Attr, Rule> } {
  const nVar = level <= 2 ? 1 : level <= 5 ? 2 : level <= 8 ? 3 : 4;
  const varying = shuffle([...ATTRS]).slice(0, nVar);
  const rules = {} as Record<Attr, Rule>;
  const value = {} as Record<Attr, (r: number, c: number) => number>;
  for (const a of ATTRS) {
    const perm = shuffle([0, 1, 2]);
    const rule: Rule = !varying.includes(a) ? 'const' : pick(level >= 4 ? (['row', 'col', 'latin', 'latin'] as Rule[]) : (['row', 'col'] as Rule[]));
    rules[a] = rule;
    const step = pick([1, 2]);
    value[a] =
      rule === 'const' ? () => perm[0]
      : rule === 'row' ? (r) => perm[r]
      : rule === 'col' ? (_r, c) => perm[c]
      : (r, c) => perm[(r + c * step) % 3];
  }
  const cells: Cell[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    cells.push({ shape: value.shape(r, c), count: value.count(r, c), fill: value.fill(r, c), size: value.size(r, c) });
  }
  return { cells, rules };
}

const cellKey = (c: Cell) => `${c.shape}${c.count}${c.fill}${c.size}`;

function matrixItem(level: number): Item {
  const { cells, rules } = buildMatrix(level);
  const answer = cells[8];
  const options = new Map<string, Cell>([[cellKey(answer), answer]]);
  const varying = ATTRS.filter((a) => rules[a] !== 'const');
  while (options.size < 6) {
    const c = { ...answer };
    // on modifie d'abord un attribut qui varie dans la matrice : les pièges restent plausibles
    const a = Math.random() < 0.7 ? pick(varying) : pick([...ATTRS]);
    c[a] = (c[a] + pick([1, 2])) % 3;
    if (Math.random() < 0.3) { const b = pick([...ATTRS]); c[b] = (c[b] + 1) % 3; }
    options.set(cellKey(c), c);
  }
  const list = shuffle([...options.values()]);
  return {
    prompt: 'Quelle case complète la matrice ?',
    matrix: cells.slice(0, 8),
    kind: 'choice',
    choices: list.map((cell) => ({ cell })),
    answer: String(list.findIndex((c) => cellKey(c) === cellKey(answer))),
    limitMs: lerp(level, 45000, 20000),
    explain: ATTRS.filter((a) => rules[a] !== 'const').map((a) => `${ATTR_NAMES[a]} : ${RULE_TEXT[rules[a]]}`).join('. ') + '.',
  };
}

export const logicMatrix: ExerciseDef = {
  id: 'logic-matrix',
  name: 'Matrices',
  category: 'logique',
  rules:
    'Une grille de neuf cases suit des règles sur la forme, le nombre, le remplissage et la taille des figures. La dernière case manque : choisis celle qui respecte toutes les règles. Le temps est limité.',
  estMinutes: 3,
  targetMs: (l) => lerp(l, 12000, 14000),
  generate: (level) => Array.from({ length: 10 }, () => matrixItem(level)),
};

// --- 6. Sprint de calcul (durée fixe) ----------------------------------------

export const calcSprint: ExerciseDef = {
  id: 'calc-sprint',
  name: 'Sprint de calcul',
  category: 'calcul',
  rules: 'Durée fixe : 90 secondes. Enchaîne le plus de calculs justes possible. Une erreur ne t’arrête pas : la correction est dans le bilan.',
  estMinutes: 2,
  fast: true,
  timeLimitS: 90,
  targetMs: (l) => lerp(l, 3500, 8000),
  generate: (level) => Array.from({ length: 120 }, () => opItemForSprint(level)),
};
