import { type ExerciseDef, type Figure, type Item, lerp, pick, rnd, shuffle } from './types';

interface Series { terms: number[]; next: number; rule: string }

function series(level: number): Series {
  const kinds = ['arith', 'incr'];
  if (level >= 2) kinds.push('geom');
  if (level >= 4) kinds.push('fib', 'squares');
  if (level >= 5) kinds.push('alt');
  if (level >= 7) kinds.push('interleaved', 'interleaved');
  const kind = pick(kinds);
  const seq: number[] = [];
  if (kind === 'arith') {
    const step = rnd(2, 3 + level * 2) * (level >= 3 && Math.random() < 0.4 ? -1 : 1);
    const start = rnd(1, 20 + level * 8) + (step < 0 ? 6 * -step : 0);
    for (let i = 0; i < 6; i++) seq.push(start + i * step);
    return { terms: seq.slice(0, 5), next: seq[5], rule: step > 0 ? `On ajoute ${step} à chaque terme.` : `On retire ${-step} à chaque terme.` };
  }
  if (kind === 'incr') {
    const k = rnd(1, 1 + Math.floor(level / 3));
    let d = rnd(1, 4), v = rnd(1, 15);
    for (let i = 0; i < 6; i++) { seq.push(v); v += d; d += k; }
    return { terms: seq.slice(0, 5), next: seq[5], rule: `L’écart entre deux termes augmente de ${k} à chaque fois.` };
  }
  if (kind === 'geom') {
    const r = rnd(2, level > 5 ? 4 : 3);
    let v = rnd(1, 5);
    for (let i = 0; i < 6; i++) { seq.push(v); v *= r; }
    return { terms: seq.slice(0, 5), next: seq[5], rule: `Chaque terme est multiplié par ${r}.` };
  }
  if (kind === 'fib') {
    seq.push(rnd(1, 6), rnd(2, 9));
    for (let i = 2; i < 7; i++) seq.push(seq[i - 1] + seq[i - 2]);
    return { terms: seq.slice(0, 6), next: seq[6], rule: 'Chaque terme est la somme des deux précédents.' };
  }
  if (kind === 'squares') {
    const n0 = rnd(1, 6), c = rnd(0, level >= 7 ? 5 : 0);
    for (let i = 0; i < 6; i++) seq.push((n0 + i) ** 2 + c);
    return {
      terms: seq.slice(0, 5), next: seq[5],
      rule: `Suite des carrés à partir de ${n0}²${c ? `, augmentés de ${c}` : ''}.`,
    };
  }
  if (kind === 'alt') {
    const a = rnd(2, 9), m = rnd(2, 3);
    let v = rnd(1, 6);
    for (let i = 0; i < 7; i++) { seq.push(v); v = i % 2 === 0 ? v + a : v * m; }
    return { terms: seq.slice(0, 6), next: seq[6], rule: `Alternance : + ${a}, puis × ${m}.` };
  }
  const s1 = rnd(1, 20), d1 = rnd(2, 9), s2 = rnd(30, 60), d2 = -rnd(2, 7);
  for (let i = 0; i < 4; i++) seq.push(s1 + i * d1, s2 + i * d2);
  return {
    terms: seq.slice(0, 6), next: seq[6],
    rule: `Deux suites entrelacées : l’une avance de + ${d1}, l’autre de ${d2}.`,
  };
}

export const logicSeries: ExerciseDef = {
  id: 'logic-series',
  name: 'Suites numériques',
  category: 'logique',
  rules: 'Trouvez la règle qui relie les nombres, puis saisissez le terme suivant.',
  estMinutes: 3,
  targetMs: (l) => lerp(l, 9000, 16000),
  generate: (level) =>
    Array.from({ length: 8 }, (): Item => {
      const s = series(level);
      return {
        prompt: `${s.terms.join('   ')}   ?`,
        kind: 'numeric',
        answer: String(s.next),
        explain: `${s.rule} Terme suivant : ${s.next}.`,
      };
    }),
};

// --- Rotation mentale -------------------------------------------------------

type Cells = [number, number][];

const TETRO: Cells[] = [[[0, 0], [1, 0], [2, 0], [2, 1]]];
const PENTO: Cells[] = [
  [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
  [[0, 1], [1, 1], [2, 0], [2, 1], [3, 0]],
  [[0, 1], [1, 0], [1, 1], [2, 1], [3, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
];
const HEXA: Cells[] = [
  [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2], [3, 1]],
  [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2], [3, 2]],
  [[0, 1], [1, 0], [1, 1], [1, 2], [2, 2], [3, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0], [2, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2], [2, 1], [3, 1]],
];

const normalize = (cells: Cells): Cells => {
  const minR = Math.min(...cells.map((c) => c[0]));
  const minC = Math.min(...cells.map((c) => c[1]));
  return cells
    .map(([r, c]): [number, number] => [r - minR, c - minC])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};
const rot = (cells: Cells): Cells => normalize(cells.map(([r, c]): [number, number] => [c, -r]));
const mirror = (cells: Cells): Cells => normalize(cells.map(([r, c]): [number, number] => [r, -c]));
export const shapeKey = (cells: Cells) => normalize(cells).map((c) => c.join(',')).join(';');

/** Les 4 rotations d'une forme. */
export function rotations(cells: Cells): Cells[] {
  const out = [normalize(cells)];
  for (let i = 0; i < 3; i++) out.push(rot(out[out.length - 1]));
  return out;
}

/** Une forme est utilisable si ses 8 orientations (rotations + miroirs) sont distinctes. */
export function isChiral(cells: Cells): boolean {
  const keys = new Set([...rotations(cells), ...rotations(mirror(cells))].map(shapeKey));
  return keys.size === 8;
}

function toFigure(cells: Cells, n: number): Figure {
  const h = Math.max(...cells.map((c) => c[0])) + 1;
  const w = Math.max(...cells.map((c) => c[1])) + 1;
  const or = Math.floor((n - h) / 2), oc = Math.floor((n - w) / 2);
  const fig: Figure = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  for (const [r, c] of cells) fig[r + or][c + oc] = true;
  return fig;
}

export const SHAPES = { TETRO, PENTO, HEXA };

function rotationItem(level: number): Item {
  const pool = (level <= 3 ? [...TETRO, PENTO[1], PENTO[4]] : level <= 6 ? PENTO : [...PENTO, ...HEXA]).filter(isChiral);
  const base = pick(pool);
  const same = shuffle(rotations(base));
  const mirrors = shuffle(rotations(mirror(base)));
  const model = same[0];
  const correct = same[1];
  const options = shuffle([correct, ...mirrors.slice(0, 3)]);
  return {
    prompt: 'Quelle figure est le modèle, simplement tourné ?',
    figure: toFigure(model, 4),
    kind: 'choice',
    choices: options.map((o) => ({ figure: toFigure(o, 4) })),
    answer: String(options.indexOf(correct)),
    limitMs: lerp(level, 20000, 7000),
    explain:
      'Une seule proposition se superpose au modèle par rotation dans le plan ; les trois autres sont des images miroir.',
  };
}

export const spatialRotation: ExerciseDef = {
  id: 'spa-rotation',
  name: 'Rotation mentale',
  category: 'spatial',
  rules:
    'Un modèle est affiché en haut. Parmi les quatre propositions, une seule est le modèle tourné ; les autres sont retournées (effet miroir). Le temps est limité.',
  estMinutes: 2,
  targetMs: (l) => lerp(l, 9000, 5000),
  generate: (level) => Array.from({ length: 8 }, () => rotationItem(level)),
};
