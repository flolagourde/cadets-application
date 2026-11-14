import { type ExerciseDef, type Item, lerp, pick, rnd, shuffle } from './types';

const fr = (n: number) => n.toLocaleString('fr-FR');
const band = (level: number) => Math.ceil(level / 2); // 1..5
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

function opItem(level: number): Item {
  const b = band(level);
  const type = pick(b === 1 ? ['+', '-'] : b === 2 ? ['+', '-', '×'] : ['+', '-', '×', '÷']);
  const addRange: [number, number][] = [[2, 20], [10, 60], [20, 150], [100, 600], [200, 999]];
  const [lo, hi] = addRange[b - 1];
  let x: number, y: number, res: number;
  if (type === '+') {
    x = rnd(lo, hi); y = rnd(lo, hi); res = x + y;
  } else if (type === '-') {
    const p = rnd(lo, hi), q = rnd(lo, hi);
    x = Math.max(p, q); y = Math.min(p, q); res = x - y;
  } else if (type === '×') {
    if (b <= 2) { x = rnd(2, 9); y = rnd(2, 9); }
    else if (b === 3) { x = rnd(11, 30); y = rnd(2, 9); }
    else if (b === 4) { x = rnd(12, 60); y = rnd(3, 9); }
    else { x = rnd(11, 35); y = rnd(11, 25); }
    res = x * y;
  } else {
    y = b === 5 ? rnd(3, 15) : rnd(2, 9);
    const q = b === 3 ? rnd(2, 12) : b === 4 ? rnd(6, 40) : rnd(12, 80);
    x = y * q; res = q;
  }
  return {
    prompt: `${fr(x)} ${type} ${fr(y)}`,
    kind: 'numeric',
    answer: String(res),
    explain: `${fr(x)} ${type} ${fr(y)} = ${fr(res)}`,
  };
}

export const calcOps: ExerciseDef = {
  id: 'calc-ops',
  name: 'Opérations rapides',
  category: 'calcul',
  rules: 'Calculez de tête, sans poser l’opération, puis validez. La précision compte autant que la vitesse.',
  estMinutes: 2,
  targetMs: (l) => lerp(l, 4000, 9000),
  generate: (level) => Array.from({ length: 12 }, () => opItem(level)),
};

function percentItem(level: number): Item {
  const b = band(level);
  const variant = level >= 7 && Math.random() < 0.35 ? 'variation' : level >= 4 && Math.random() < 0.4 ? 'fraction' : 'pct';
  if (variant === 'fraction') {
    const d = rnd(2, b >= 4 ? 9 : 6);
    let n = rnd(1, d - 1);
    while (gcd(n, d) !== 1) n = rnd(1, d - 1);
    const base = d * rnd(2, 6 * b);
    const res = (base / d) * n;
    return {
      prompt: `${n}/${d} de ${fr(base)}`,
      kind: 'numeric',
      answer: String(res),
      explain: `${fr(base)} ÷ ${d} = ${fr(base / d)}, puis × ${n} = ${fr(res)}`,
    };
  }
  const sets = [[10, 50, 25], [20, 75, 5], [15, 30, 40, 60], [35, 45, 65, 12], [8, 16, 24, 85, 95]];
  const p = pick(sets[b - 1]);
  const base = (100 / gcd(p, 100)) * rnd(1, 3 * b + 2);
  const part = (base * p) / 100;
  if (variant === 'variation') {
    const up = Math.random() < 0.5;
    const res = up ? base + part : base - part;
    return {
      prompt: `${fr(base)} ${up ? 'augmenté' : 'diminué'} de ${p} %`,
      kind: 'numeric',
      answer: String(res),
      explain: `${p} % de ${fr(base)} = ${fr(part)}, donc ${fr(base)} ${up ? '+' : '−'} ${fr(part)} = ${fr(res)}`,
    };
  }
  return {
    prompt: `${p} % de ${fr(base)}`,
    kind: 'numeric',
    answer: String(part),
    explain: `${p} % de ${fr(base)} = ${fr(base)} × ${p} ÷ 100 = ${fr(part)}`,
  };
}

export const calcPercent: ExerciseDef = {
  id: 'calc-percent',
  name: 'Pourcentages et fractions',
  category: 'calcul',
  rules: 'Calculez le pourcentage ou la fraction demandés. Toutes les réponses sont des nombres entiers.',
  estMinutes: 2,
  targetMs: (l) => lerp(l, 6000, 11000),
  generate: (level) => Array.from({ length: 10 }, () => percentItem(level)),
};

const round2 = (n: number) => {
  const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1));
  return Math.round(n / mag) * mag;
};

function estimateItem(level: number): Item {
  const b = band(level);
  const x = rnd(lerp(level, 12, 120), lerp(level, 99, 999));
  const y = rnd(lerp(level, 6, 30), lerp(level, 40, 400));
  const exact = x * y;
  const factors = b <= 2 ? [0.1, 10, 0.5, 2] : b <= 4 ? [0.5, 2, 0.7, 1.5] : [0.8, 1.25, 0.65, 1.5];
  const good = round2(exact);
  const options = new Set<number>([good]);
  for (const f of shuffle(factors)) {
    if (options.size < 4) options.add(round2(exact * f));
  }
  const list = [...options].sort((a, c) => a - c);
  return {
    prompt: `${fr(x)} × ${fr(y)} ≈ ?`,
    sub: 'Choisissez l’ordre de grandeur le plus proche',
    kind: 'choice',
    choices: list.map((v) => ({ label: fr(v) })),
    answer: String(list.indexOf(good)),
    limitMs: lerp(level, 12000, 6000),
    explain: `${fr(x)} × ${fr(y)} = ${fr(exact)}${exact === good ? '' : `, soit environ ${fr(good)}`}. Méthode : arrondir chaque facteur avant de multiplier.`,
  };
}

export const calcEstimate: ExerciseDef = {
  id: 'calc-estimate',
  name: 'Estimation',
  category: 'calcul',
  rules: 'Sans calcul exact, choisissez la valeur la plus proche du résultat. Le temps de réponse est limité.',
  estMinutes: 2,
  targetMs: (l) => lerp(l, 6000, 4500),
  generate: (level) => Array.from({ length: 10 }, () => estimateItem(level)),
};
