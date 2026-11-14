import { describe, expect, it } from 'vitest';
import type { Result } from '../db';
import { composeSession, decideLevel, streak } from '../domain/adaptive';
import { alter } from './attention';
import { isChiral, SHAPES } from './logic';
import { nbackStream } from './memory';
import { EXERCISE_LIST, EXERCISES } from './registry';

const figKey = (f: boolean[][]) => f.map((r) => r.map((c) => (c ? 1 : 0)).join('')).join('/');

describe('générateurs', () => {
  for (const def of EXERCISE_LIST) {
    it(`${def.id} : items cohérents à tous les niveaux`, () => {
      for (let level = 1; level <= 10; level++) {
        for (let rep = 0; rep < 30; rep++) {
          const items = def.generate(level);
          expect(items.length).toBeGreaterThan(0);
          for (const it of items) {
            if (it.kind === 'none') { expect(it.observeMs).toBeGreaterThan(0); continue; }
            expect(it.explain.length).toBeGreaterThan(0);
            if (it.kind === 'choice') {
              const n = it.choices!.length;
              expect(n).toBeGreaterThanOrEqual(2);
              expect(Number(it.answer)).toBeGreaterThanOrEqual(0);
              expect(Number(it.answer)).toBeLessThan(n);
              const keys = it.choices!.map((c) => c.label ?? figKey(c.figure!));
              expect(new Set(keys).size).toBe(n); // aucune proposition en double
            } else {
              expect(it.answer).toMatch(/^\d+$/); // saisissable au pavé numérique
            }
          }
        }
      }
    });
  }

  it('opérations : la réponse est le résultat exact', () => {
    for (let level = 1; level <= 10; level++) {
      for (const it of EXERCISES['calc-ops'].generate(level)) {
        const [a, op, b] = it.prompt.replace(/ | /g, '').split(' ');
        const x = Number(a), y = Number(b);
        const res = op === '+' ? x + y : op === '-' ? x - y : op === '×' ? x * y : x / y;
        expect(Number(it.answer)).toBe(res);
      }
    }
  });

  it('recherche : le compte correspond à la grille', () => {
    for (const it of EXERCISES['att-search'].generate(7)) {
      const target = it.prompt.replace('Combien de ', '').replace(' ?', '');
      expect(it.grid!.flat().filter((s) => s === target).length).toBe(Number(it.answer));
    }
  });

  it('comparaison : la réponse reflète l’égalité réelle', () => {
    for (let level = 1; level <= 10; level++) {
      for (const it of EXERCISES['att-compare'].generate(level)) {
        expect(it.answer).toBe(it.pair![0] === it.pair![1] ? '0' : '1');
      }
    }
    for (let i = 0; i < 500; i++) expect(alter('AB0O1I8S', true)).not.toBe('AB0O1I8S');
  });

  it('n-back : flux de la bonne longueur', () => {
    expect(nbackStream(2, 20)).toHaveLength(22);
  });

  it('rotation : toutes les formes ont 8 orientations distinctes, la bonne réponse n’est pas un miroir', () => {
    for (const s of [...SHAPES.TETRO, ...SHAPES.PENTO, ...SHAPES.HEXA]) expect(isChiral(s)).toBe(true);
  });

  it('empan : la réponse inverse la suite à partir du niveau 6', () => {
    for (const it of EXERCISES['mem-span'].generate(8)) {
      expect(it.answer).toBe([...it.memorize!.tokens].reverse().join(''));
    }
    for (const it of EXERCISES['mem-span'].generate(3)) expect(it.answer).toBe(it.memorize!.tokens.join(''));
  });
});

const res = (over: Partial<Result>): Result => ({
  date: new Date().toISOString(), source: 'app', exerciseId: 'calc-ops', exerciseName: 'x', category: 'calcul',
  level: 3, correct: 11, wrong: 1, total: 12, medianMs: 3000, ...over,
});

describe('adaptation', () => {
  const def = EXERCISES['calc-ops'];
  it('ne réagit pas à une seule séance', () => {
    expect(decideLevel(def, 3, [res({})]).level).toBe(3);
  });
  it('monte après deux séances précises et rapides', () => {
    expect(decideLevel(def, 3, [res({}), res({})]).level).toBe(4);
  });
  it('reste au niveau si précis mais trop lent', () => {
    const d = decideLevel(def, 3, [res({ medianMs: 60000 }), res({})]);
    expect(d.level).toBe(3);
    expect(d.reason).toContain('vitesse');
  });
  it('descend après deux séances sous 60 %', () => {
    expect(decideLevel(def, 3, [res({ correct: 5 }), res({ correct: 6 })]).level).toBe(2);
  });
  it('ignore les séances d’un autre niveau', () => {
    expect(decideLevel(def, 3, [res({}), res({ level: 2 })]).level).toBe(3);
  });
  it('un mauvais résultat isolé ne fait pas descendre', () => {
    expect(decideLevel(def, 3, [res({ correct: 2 }), res({})]).level).toBe(3);
  });
  it('compose une séance dans le budget, variée, avec raisons', () => {
    const plan = composeSession(10, []);
    expect(plan.length).toBeGreaterThanOrEqual(3);
    const mins = plan.reduce((s, p) => s + EXERCISES[p.exerciseId].estMinutes, 0);
    expect(mins).toBeLessThanOrEqual(11);
    expect(new Set(plan.map((p) => EXERCISES[p.exerciseId].category)).size).toBeGreaterThanOrEqual(3);
    expect(plan.every((p) => p.reason.length > 0)).toBe(true);
  });
  it('priorise un exercice faible sur un exercice réussi, à ancienneté égale', () => {
    const weak = res({ exerciseId: 'calc-percent', correct: 4, total: 12 });
    const strong = EXERCISE_LIST.filter((e) => e.id !== 'calc-percent').map((e) => res({ exerciseId: e.id, category: e.category, correct: 12 }));
    expect(composeSession(4, [weak, ...strong])[0].exerciseId).toBe('calc-percent');
  });
  it('calcule la série de jours', () => {
    const d = (n: number) => { const x = new Date(); x.setDate(x.getDate() - n); return res({ date: x.toISOString() }); };
    expect(streak([d(0), d(1), d(2), d(4)])).toBe(3);
    expect(streak([d(1), d(2)])).toBe(2);
    expect(streak([d(3)])).toBe(0);
  });
});
