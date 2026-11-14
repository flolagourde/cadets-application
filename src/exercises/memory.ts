import { type ExerciseDef, type Item, lerp, pick, rnd } from './types';

function digits(len: number): string[] {
  const out: string[] = [];
  while (out.length < len) {
    const d = String(rnd(0, 9));
    if (out[out.length - 1] !== d) out.push(d);
  }
  return out;
}

export const memSpan: ExerciseDef = {
  id: 'mem-span',
  name: 'Empan de chiffres',
  category: 'memoire',
  rules:
    'Des chiffres apparaissent un par un. Quand la saisie s’ouvre, restituez la suite. À partir du niveau 6, la restitution se fait à l’envers (mémoire de travail).',
  estMinutes: 3,
  targetMs: () => Number.POSITIVE_INFINITY, // la vitesse de saisie n'est pas un critère ici
  generate: (level) => {
    const reverse = level >= 6;
    const len = 3 + Math.ceil(level * 0.7) - (reverse ? 3 : 0);
    return Array.from({ length: 6 }, (): Item => {
      const seq = digits(len);
      const expected = (reverse ? [...seq].reverse() : seq).join('');
      return {
        prompt: reverse ? 'Saisissez la suite À L’ENVERS' : 'Saisissez la suite dans l’ordre',
        memorize: { tokens: seq, perTokenMs: lerp(level, 950, 650) },
        kind: 'numeric',
        exact: true,
        answer: expected,
        explain: `Suite présentée : ${seq.join(' ')}${reverse ? ` → à l’envers : ${expected.split('').join(' ')}` : ''}`,
      };
    });
  },
};

const LETTERS = ['B', 'F', 'H', 'K', 'L', 'M', 'R', 'T'];

export function nbackStream(n: number, scored: number): string[] {
  const s: string[] = [];
  for (let i = 0; i < n + scored; i++) {
    if (i >= n && Math.random() < 0.33) s.push(s[i - n]);
    else {
      let l = pick(LETTERS);
      while (i >= n && l === s[i - n]) l = pick(LETTERS);
      s.push(l);
    }
  }
  return s;
}

export const memNback: ExerciseDef = {
  id: 'mem-nback',
  name: 'N-back lettres',
  category: 'memoire',
  rules:
    'Des lettres défilent. Pour chacune, indiquez si elle est identique à celle vue N positions plus tôt (N = 1 aux niveaux 1-3, 2 aux niveaux 4-7, 3 ensuite). Sans réponse dans le temps imparti, l’item est compté faux.',
  estMinutes: 2,
  fast: true,
  targetMs: (l) => lerp(l, 1800, 1300),
  generate: (level) => {
    const n = level < 4 ? 1 : level < 8 ? 2 : 3;
    const s = nbackStream(n, 20);
    const sub = `Identique à la lettre vue ${n} position${n > 1 ? 's' : ''} avant ?`;
    return s.map((letter, i): Item => {
      if (i < n) return { prompt: letter, big: true, sub: 'Mémorisez', observeMs: 1800, kind: 'none', answer: '', explain: '' };
      const same = letter === s[i - n];
      return {
        prompt: letter,
        big: true,
        sub,
        kind: 'choice',
        choices: [{ label: 'Identique' }, { label: 'Différente' }],
        answer: same ? '0' : '1',
        limitMs: lerp(level, 3200, 2000),
        explain: `Lettre ${letter} ; ${n} position${n > 1 ? 's' : ''} avant : ${s[i - n]} → ${same ? 'identique' : 'différente'}.`,
      };
    });
  },
};
