import { type ExerciseDef, type Item, lerp, pick, rnd, shuffle } from './types';

const SYMBOLS = ['▲', '△', '●', '○', '■', '□', '◆', '◇'];

function searchItem(level: number): Item {
  const rows = lerp(level, 4, 8), cols = lerp(level, 5, 8);
  const set = shuffle(SYMBOLS).slice(0, lerp(level, 3, 8));
  const target = set[0];
  const others = set.slice(1);
  const total = rows * cols;
  const count = rnd(1, lerp(level, 5, 12));
  const cells = shuffle([
    ...Array<string>(count).fill(target),
    ...Array.from({ length: total - count }, () => pick(others)),
  ]);
  const grid = Array.from({ length: rows }, (_, r) => cells.slice(r * cols, (r + 1) * cols));
  return {
    prompt: `Combien de ${target} ?`,
    grid,
    kind: 'numeric',
    answer: String(count),
    explain: `La grille contenait ${count} ${target}.`,
  };
}

export const attSearch: ExerciseDef = {
  id: 'att-search',
  name: 'Recherche de symboles',
  category: 'attention',
  rules: 'Comptez le plus vite possible le symbole cible dans la grille, sans vous laisser distraire par les symboles proches.',
  estMinutes: 2,
  targetMs: (l) => lerp(l, 6000, 11000),
  generate: (level) => Array.from({ length: 8 }, () => searchItem(level)),
};

const CHARSET = 'ABCDEFGHIKLMNOPQRSTUVXZ0123456789';
const CONFUSION: Record<string, string> = {
  O: '0', '0': 'O', I: '1', '1': 'I', B: '8', '8': 'B', S: '5', '5': 'S', Z: '2', '2': 'Z',
  G: '6', '6': 'G', E: 'F', F: 'E', P: 'R', R: 'P', M: 'N', N: 'M', U: 'V', V: 'U', C: 'G', Q: 'O', D: 'O',
};

/** Renvoie une copie différente d'un seul détail (substitution proche ou inversion). */
export function alter(s: string, allowSwap: boolean): string {
  const chars = s.split('');
  if (allowSwap && Math.random() < 0.5) {
    const idx = shuffle(chars.map((_, i) => i).slice(0, -1)).find((i) => chars[i] !== chars[i + 1]);
    if (idx !== undefined) {
      [chars[idx], chars[idx + 1]] = [chars[idx + 1], chars[idx]];
      return chars.join('');
    }
  }
  const i = rnd(0, chars.length - 1);
  let repl = CONFUSION[chars[i]];
  while (!repl || repl === chars[i]) repl = pick(CHARSET.split(''));
  chars[i] = repl;
  return chars.join('');
}

function compareItem(level: number): Item {
  const len = lerp(level, 5, 12);
  const a = Array.from({ length: len }, () => pick(CHARSET.split(''))).join('');
  const same = Math.random() < 0.5;
  const b = same ? a : alter(a, level >= 6);
  let diff = '';
  if (!same) {
    const pos = a.split('').findIndex((ch, i) => ch !== b[i]);
    diff = ` Différence en position ${pos + 1} : « ${a[pos]} » / « ${b[pos]} ».`;
  }
  return {
    prompt: 'Les deux séquences sont-elles identiques ?',
    pair: [a, b],
    kind: 'choice',
    choices: [{ label: 'Identiques' }, { label: 'Différentes' }],
    answer: same ? '0' : '1',
    explain: `${a} / ${b} : ${same ? 'identiques.' : 'différentes.'}${diff}`,
  };
}

export const attCompare: ExerciseDef = {
  id: 'att-compare',
  name: 'Comparaison de séquences',
  category: 'attention',
  rules: 'Deux séquences sont affichées l’une sous l’autre. Décidez si elles sont strictement identiques. Les pièges portent sur des caractères proches (O/0, I/1, B/8…).',
  estMinutes: 2,
  targetMs: (l) => lerp(l, 3500, 5500),
  generate: (level) => Array.from({ length: 16 }, () => compareItem(level)),
};

export const attSwitch: ExerciseDef = {
  id: 'att-switch',
  name: 'Changement de règle',
  category: 'attention',
  rules:
    'Un chiffre apparaît sur fond coloré. Fond BLEU : est-il pair ou impair ? Fond ORANGE : est-il plus petit ou plus grand que 5 ? La règle change sans prévenir.',
  estMinutes: 2,
  fast: true,
  targetMs: (l) => lerp(l, 1800, 1000),
  generate: (level) => {
    const switchP = lerp(level, 25, 50) / 100;
    let blue = Math.random() < 0.5;
    return Array.from({ length: 24 }, (): Item => {
      if (Math.random() < switchP) blue = !blue;
      const d = pick([1, 2, 3, 4, 6, 7, 8, 9]);
      const first = blue ? d % 2 === 0 : d < 5;
      return {
        prompt: String(d),
        big: true,
        tint: blue ? 'blue' : 'amber',
        kind: 'choice',
        choices: blue ? [{ label: 'Pair' }, { label: 'Impair' }] : [{ label: 'Plus petit que 5' }, { label: 'Plus grand que 5' }],
        answer: first ? '0' : '1',
        limitMs: lerp(level, 3500, 1500),
        explain: blue
          ? `Fond bleu → parité : ${d} est ${d % 2 === 0 ? 'pair' : 'impair'}.`
          : `Fond orange → comparaison à 5 : ${d} est ${d < 5 ? 'plus petit' : 'plus grand'}.`,
      };
    });
  },
};
