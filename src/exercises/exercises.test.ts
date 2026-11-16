import { describe, expect, it } from 'vitest';
import type { Result } from '../db';
import type { ExtTest } from '../db';
import { composeExternal, composeSession, decideLevel, extPriority, rankExternal, streak } from '../domain/adaptive';
import { type BiaPack, biaExercise, dueIds, LEITNER_DAYS, partStatus, srsUpdate, validatePack } from '../domain/bia';
import { SEED } from '../domain/catalog';
import { alter } from './attention';
import { buildMatrix, cascade, dialBoard, NUMBER_LAWS, readDial, signedSum, WORD_LAWS } from './critical';
import { isChiral, SHAPES } from './logic';
import { nbackStream } from './memory';
import { PASSAGES, VOCAB } from '../content/english';
import { FICHES } from '../content/fiches';
import { pickQuestions } from '../content/quiz';
import { EXERCISE_LIST, EXERCISES, getExercise } from './registry';

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
            if (it.kind === 'multi') {
              expect(it.answer).toMatch(/^(none|\d(,\d)*)$/);
              if (it.answer === 'none') expect(it.allowNone).toBe(true);
              expect(new Set(it.choices!.map((c) => c.label)).size).toBe(it.choices!.length);
            } else if (it.kind === 'choice') {
              const n = it.choices!.length;
              expect(n).toBeGreaterThanOrEqual(2);
              expect(Number(it.answer)).toBeGreaterThanOrEqual(0);
              expect(Number(it.answer)).toBeLessThan(n);
              const keys = it.choices!.map((c) => c.label ?? (c.cell ? JSON.stringify(c.cell) : figKey(c.figure!)));
              expect(new Set(keys).size).toBe(n); // aucune proposition en double
            } else {
              expect(it.answer).toMatch(it.signed ? /^-?\d+$/ : /^\d+$/); // saisissable au pavé numérique
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

describe('coach plateformes', () => {
  const t = (over: Partial<ExtTest>): ExtTest => ({ id: 'pilotest:a', source: 'pilotest', name: 'A', stage: 'psy1', aptitudes: [], target: 6, weak: false, active: true, ...over });
  const ext = (id: string, stanine: number | undefined, daysAgo = 0): Result => {
    const d = new Date(); d.setDate(d.getDate() - daysAgo);
    return { date: d.toISOString(), source: 'pilotest', exerciseId: id, exerciseName: id, category: 'autre', stanine };
  };
  it('catalogue : identifiants uniques, 16 tests psy1 et 14 psy0', () => {
    expect(new Set(SEED.map((x) => x.id)).size).toBe(SEED.length);
    expect(SEED.filter((x) => x.stage === 'psy1')).toHaveLength(16);
    expect(SEED.filter((x) => x.stage === 'psy0')).toHaveLength(14);
  });
  it('un test sous l’objectif passe avant un test au-dessus, à ancienneté égale', () => {
    const tests = [t({ id: 'p:haut', name: 'Haut' }), t({ id: 'p:bas', name: 'Bas' })];
    const r = rankExternal(tests, [ext('p:haut', 8), ext('p:bas', 3)]);
    expect(r[0].test.id).toBe('p:bas');
    expect(r[0].reason).toContain('Stanine récente 3');
  });
  it('la stanine récente est la moyenne des 3 dernières saisies', () => {
    const p = extPriority(t({}), [ext('pilotest:a', 6, 0), ext('pilotest:a', 5, 1), ext('pilotest:a', 4, 2), ext('pilotest:a', 1, 3)]);
    expect(p.stats.recent).toBe(5);
    expect(p.stats.best).toBe(6);
  });
  it('un point faible déclaré remonte dans le classement', () => {
    const tests = [t({ id: 'p:x', name: 'X' }), t({ id: 'p:y', name: 'Y', weak: true })];
    expect(rankExternal(tests, [ext('p:x', 5), ext('p:y', 5)])[0].test.id).toBe('p:y');
  });
  it('ignore les tests désactivés et respecte le budget de minutes', () => {
    const tests = [t({ id: 'p:1', minutes: 30 }), t({ id: 'p:2', minutes: 20 }), t({ id: 'p:3', minutes: 10 }), t({ id: 'p:off', active: false })];
    const plan = composeExternal(30, tests, []);
    expect(plan.some((p) => p.testId === 'p:off')).toBe(false);
    const total = plan.reduce((s, p) => s + tests.find((x) => x.id === p.testId)!.minutes!, 0);
    expect(total).toBeLessThanOrEqual(30);
    expect(plan.length).toBeGreaterThanOrEqual(1);
  });
  it('sans aucune saisie, propose de situer le niveau', () => {
    expect(composeExternal(15, SEED, [])[0].reason).toContain('Jamais saisi');
  });
  it('les domaines renforcés remontent dans la séance du téléphone', () => {
    const all = EXERCISE_LIST.map((e) => res({ exerciseId: e.id, category: e.category, correct: 9 }));
    expect(EXERCISES[composeSession(2, all, new Date(), ['spatial'])[0].exerciseId].category).toBe('spatial');
  });
});

describe('bibliothèque et quiz', () => {
  const all = [...FICHES.flatMap((f) => f.questions), ...PASSAGES.flatMap((p) => p.questions)];
  it('identifiants de questions et de fiches uniques', () => {
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
    expect(new Set(FICHES.map((f) => f.id)).size).toBe(FICHES.length);
  });
  it('chaque question a 4 propositions distinctes et une explication', () => {
    for (const q of all) {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.explain.length).toBeGreaterThan(10);
    }
  });
  it('chaque fiche est datée, sourcée, et ses données changeantes sont signalées', () => {
    for (const f of FICHES) {
      expect(f.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(f.sources.length).toBeGreaterThan(0);
      expect(f.questions.length).toBeGreaterThan(3);
    }
    expect(FICHES.find((f) => f.id === 'af-groupe')!.questions.filter((q) => q.volatile).length).toBeGreaterThanOrEqual(3);
  });
  it('vocabulaire sans doublon', () => {
    expect(new Set(VOCAB.map((v) => v[0])).size).toBe(VOCAB.length);
    expect(new Set(VOCAB.map((v) => v[1])).size).toBe(VOCAB.length);
  });
  it('le tirage privilégie les questions jamais vues puis les plus ratées', () => {
    const bank = Array.from({ length: 20 }, (_, i) => ({ id: `q${i}` }));
    const stats: Record<string, [number, number]> = {};
    for (let i = 0; i < 20; i++) if (i !== 3 && i !== 7) stats[`q${i}`] = [4, i === 5 ? 0 : 4];
    for (let rep = 0; rep < 50; rep++) {
      const ids = pickQuestions(bank, stats, 8).map((q) => q.id);
      expect(ids).toContain('q3'); expect(ids).toContain('q7'); expect(ids).toContain('q5');
      expect(new Set(ids).size).toBe(8);
    }
  });
  it('la bonne réponse suit le mélange des propositions', () => {
    const def = getExercise('fiche:af-groupe')!;
    for (let rep = 0; rep < 20; rep++) {
      for (const it of def.generate(1)) {
        const q = FICHES[0].questions.find((x) => x.id === it.qid)!;
        expect(it.choices![Number(it.answer)].label).toBe(q.choices[0]);
      }
    }
  });
  it('compréhension écrite : un seul texte par séance, questions limitées en temps', () => {
    const items = EXERCISES['en-reading'].generate(1);
    expect(new Set(items.map((i) => i.passage)).size).toBe(1);
    expect(items.every((i) => i.limitMs === 45000)).toBe(true);
  });
});

describe('exercices ciblés', () => {
  // évalue une expression de cascade avec les valeurs déjà connues
  const evalExpr = (expr: string, env: Record<string, number>) => {
    const js = expr.replace(/−/g, '-').replace(/×/g, '*').replace(/[abcd]/g, (m) => `(${env[m]})`);
    expect(js).toMatch(/^[\d\s()+*-]+$/);
    return Function(`return ${js}`)() as number;
  };
  it('cascade : chaque ligne se recalcule à partir des précédentes', () => {
    for (let level = 1; level <= 10; level++) for (let rep = 0; rep < 200; rep++) {
      const c = cascade(level);
      const env: Record<string, number> = {};
      c.lines.forEach((line, i) => {
        const [name, expr] = line.split(' = ');
        env[name] = evalExpr(expr, env);
        expect(env[name]).toBe(c.values[i]);
      });
      expect(c.lines.length).toBe(level >= 5 ? 4 : 3);
    }
  });
  it('sommes signées : les intervalles cochés sont exactement ceux qui contiennent le total', () => {
    for (let level = 1; level <= 10; level++) for (let rep = 0; rep < 100; rep++) {
      const s = signedSum(level);
      expect(s.total).toBe(s.terms.reduce((a, b) => a + b, 0));
      for (const it of EXERCISES['calc-signed'].generate(level)) {
        const total = Number(it.explain.match(/Résultat : (−?\d+)/)![1].replace('−', '-'));
        const right = it.choices!.map((c, i) => {
          const [lo, hi] = c.label!.replace(/[\[\]]/g, '').split(' ; ').map((x) => Number(x.replace('−', '-')));
          return lo <= total && total <= hi ? i : -1;
        }).filter((i) => i >= 0);
        expect(it.answer).toBe(right.length ? right.join(',') : 'none');
        expect(it.choices).toHaveLength(5);
      }
    }
  });
  it('cadrans : la lecture de chaque aiguille redonne la valeur', () => {
    for (let level = 1; level <= 10; level++) for (let rep = 0; rep < 500; rep++) {
      const b = dialBoard(level);
      expect(Number(b.dials.map(readDial).join(''))).toBe(b.value);
      expect(b.dials.some((d) => d.ccw)).toBe(level >= 3);
    }
  });
  it('loi commune : exemples, contre-exemples et réponses respectent la loi annoncée', () => {
    const laws = [...NUMBER_LAWS.map((l) => ({ text: l.text, test: (x: string) => l.test(Number(x)) })), ...WORD_LAWS];
    for (let level = 1; level <= 10; level++) for (let rep = 0; rep < 40; rep++) {
      for (const it of EXERCISES['logic-law'].generate(level)) {
        const text = it.explain.match(/^Loi : (.+?)\. Éléments/)![1];
        const law = laws.find((l) => l.text === text)!;
        const list = (line: string) => line.split(' : ')[1].split(' · ');
        expect(list(it.lines![0]).every(law.test)).toBe(true);
        expect(list(it.lines![1]).some(law.test)).toBe(false);
        const right = it.choices!.map((c, i) => (law.test(c.label!) ? i : -1)).filter((i) => i >= 0);
        expect(right.length).toBeGreaterThanOrEqual(1);
        expect(it.answer).toBe(right.join(','));
        expect(it.choices).toHaveLength(6);
      }
    }
  });
  it('matrices : la case manquante est la seule proposition compatible avec les règles', () => {
    for (let level = 1; level <= 10; level++) for (let rep = 0; rep < 100; rep++) {
      const m = buildMatrix(level);
      expect(m.cells).toHaveLength(9);
      for (const a of ['shape', 'count', 'fill', 'size'] as const) {
        const v = (r: number, c: number) => m.cells[r * 3 + c][a];
        const rule = m.rules[a];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
          if (rule === 'const') expect(v(r, c)).toBe(v(0, 0));
          if (rule === 'row') expect(v(r, c)).toBe(v(r, 0));
          if (rule === 'col') expect(v(r, c)).toBe(v(0, c));
        }
        if (rule === 'latin') for (let i = 0; i < 3; i++) {
          expect(new Set([v(i, 0), v(i, 1), v(i, 2)]).size).toBe(3);
          expect(new Set([v(0, i), v(1, i), v(2, i)]).size).toBe(3);
        }
      }
    }
    for (const it of EXERCISES['logic-matrix'].generate(8)) {
      expect(it.choices).toHaveLength(6);
      expect(it.matrix).toHaveLength(8);
    }
  });
  it('sprint : durée fixe et réserve d’items suffisante', () => {
    expect(EXERCISES['calc-sprint'].timeLimitS).toBe(90);
    expect(EXERCISES['calc-sprint'].generate(1).length).toBeGreaterThanOrEqual(100);
  });
});

describe('module BIA', () => {
  // pack fictif, réservé aux tests : aucun contenu du livret
  const mk = (chapters: number, perPart = 12): BiaPack => ({
    format: 'cap-cadets-bia', version: 1, id: 'test', title: 'Pack de test', source: 'test', generatedAt: '2026-11-16',
    chapters: Array.from({ length: chapters }, (_, c) => ({
      id: `c${c + 1}`, title: `Matière ${c + 1}`,
      parts: [1, 2].map((p) => ({
        id: `c${c + 1}p${p}`, title: `Partie ${p}`, pages: [1, 2] as [number, number], sections: [{ title: 'S', points: ['x'] }],
        questions: Array.from({ length: perPart }, (_, i) => ({
          id: `t-c${c + 1}p${p}-${i}`, q: `Question ${i} ?`, choices: ['bonne', 'fausse 1', 'fausse 2', 'fausse 3'], explain: 'Parce que.', page: 3, origin: 'livret' as const,
        })),
      })),
    })),
  });
  const quiz = (acc: number, daysAgo: number): Result => {
    const d = new Date(); d.setDate(d.getDate() - daysAgo);
    return { date: d.toISOString(), source: 'app', exerciseId: 'bia:part:c1p1', exerciseName: 'x', category: 'bia', correct: Math.round(acc * 10), total: 10 };
  };

  it('valide un pack correct et rejette les packs mal formés', () => {
    expect(validatePack(mk(1)).chapters).toHaveLength(1);
    expect(() => validatePack({ format: 'autre' })).toThrow('pas un pack BIA');
    const dup = mk(1); dup.chapters[0].parts[1].questions[0].id = dup.chapters[0].parts[0].questions[0].id;
    expect(() => validatePack(dup)).toThrow('en double');
    const bad = mk(1); bad.chapters[0].parts[0].questions[0].choices = ['a', 'a'];
    expect(() => validatePack(bad)).toThrow('Propositions en double');
  });
  it('questionnaire de partie : 15 questions au plus, bonne réponse suivie après mélange, page citée', () => {
    const def = biaExercise('bia:part:c1p1', mk(1, 30), {})!;
    const items = def.generate(1, {});
    expect(items).toHaveLength(15);
    for (const it of items) {
      expect(it.choices![Number(it.answer)].label).toBe('bonne');
      expect(it.explain).toContain('Livret p. 3');
      expect(it.qid!.startsWith('t-c1p1-')).toBe(true);
    }
    expect(biaExercise('bia:part:inconnu', mk(1), {})).toBeUndefined();
    expect(biaExercise('bia:all', null, {})).toBeUndefined();
  });
  it('examen blanc : format officiel avec 5 matières, partiel sinon', () => {
    const full = biaExercise('bia:exam', mk(5, 12), {})!;
    expect(full.generate(1)).toHaveLength(100);
    expect(full.timeLimitS).toBe(150 * 60);
    expect(full.silent).toBe(true);
    expect(full.name).toBe('BIA · Examen blanc');
    const partial = biaExercise('bia:exam', mk(1, 12), {})!;
    expect(partial.generate(1)).toHaveLength(20);
    expect(partial.timeLimitS).toBe(30 * 60);
    expect(partial.name).toContain('partiel');
    // matière par matière, comme le sujet officiel
    const tags = full.generate(1).map((i) => i.tag);
    expect(tags.slice(0, 20).every((t) => t === tags[0])).toBe(true);
  });
  it('révision espacée : 1, 3, 7, 14, 30 jours, retour en boîte 1 à l’erreur', () => {
    const now = new Date('2026-11-16T10:00:00');
    let srs = {};
    const days = (due: string) => Math.round((new Date(due).getTime() - new Date('2026-11-16').getTime()) / 86400000);
    for (const expected of LEITNER_DAYS) {
      srs = srsUpdate(srs, 'q', true, now);
      expect(days((srs as Record<string, { due: string }>).q.due)).toBe(expected);
    }
    srs = srsUpdate(srs, 'q', true, now);
    expect((srs as Record<string, { box: number }>).q.box).toBe(5);
    srs = srsUpdate(srs, 'q', false, now);
    expect((srs as Record<string, { box: number; due: string }>).q).toEqual({ box: 1, due: '2026-11-17' });
    expect(dueIds(srs, now)).toEqual([]);
    expect(dueIds(srs, new Date('2026-11-17T08:00:00'))).toEqual(['q']);
  });
  it('révisions du jour : seulement les questions arrivées à échéance', () => {
    const pack = mk(1);
    expect(biaExercise('bia:due', pack, {})).toBeUndefined();
    const srs = { 't-c1p1-0': { box: 1, due: '2020-01-01' }, 't-c1p1-1': { box: 2, due: '2999-01-01' } };
    expect(biaExercise('bia:due', pack, srs)!.generate(1).map((i) => i.qid)).toEqual(['t-c1p1-0']);
  });
  it('statut : lire la fiche ne suffit pas, la maîtrise exige des résultats réguliers', () => {
    const part = mk(1).chapters[0].parts[0];
    const seen = Object.fromEntries(part.questions.map((q) => [q.id, [1, 1] as [number, number]]));
    expect(partStatus(part, false, {}, [])).toBe('none');
    expect(partStatus(part, true, {}, [])).toBe('progress');
    expect(partStatus(part, true, seen, [quiz(0.9, 0)])).toBe('reviewed');
    expect(partStatus(part, true, seen, [quiz(0.9, 0), quiz(0.9, 0), quiz(0.9, 0)])).toBe('reviewed'); // même jour
    expect(partStatus(part, true, seen, [quiz(0.9, 0), quiz(0.6, 1), quiz(0.9, 2)])).toBe('reviewed'); // irrégulier
    expect(partStatus(part, true, seen, [quiz(0.9, 0), quiz(0.8, 1), quiz(1, 2)])).toBe('mastered');
    expect(partStatus(part, false, seen, [quiz(0.9, 0), quiz(0.8, 1), quiz(1, 2)])).toBe('mastered');
    expect(partStatus(part, true, {}, [quiz(0.9, 0), quiz(0.8, 1), quiz(1, 2)])).toBe('progress'); // questions non toutes vues
  });
});
