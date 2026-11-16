import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { dayKey, db, type ErrorItem, type Result } from '../db';
import { decideLevel, type LevelDecision, median } from '../domain/adaptive';
import { doneToday, type DayPlan, nextInPlan } from '../domain/plan';
import type { QStats } from '../content/quiz';
import { biaExercise, loadPack, loadSrs, recordSrs } from '../domain/bia';
import { getExercise } from '../exercises/registry';
import type { ExerciseDef, Item } from '../exercises/types';
import { Dial, FigureView, fmtSec, Keypad, MatrixCell } from '../ui';

interface LogEntry { item: Item; given: string | null; ok: boolean; ms: number }
type Stage = 'gap' | 'memorize' | 'observe' | 'answer' | 'feedback';

function isCorrect(item: Item, given: string | null): boolean {
  if (given === null || given === '' || given === '-') return false;
  if (item.kind === 'numeric' && !item.exact) return Number(given) === Number(item.answer);
  return given === item.answer;
}

function label(item: Item, value: string | null): string {
  if (value === null) return 'pas de réponse (temps écoulé)';
  const one = (v: string) => item.choices?.[Number(v)]?.label ?? `proposition ${Number(v) + 1}`;
  if (item.kind === 'multi') return value === 'none' ? 'aucun' : value.split(',').map(one).join(' ; ');
  if (item.kind === 'choice') return one(value);
  return value.replace('-', '−');
}

function Session({ def, level, stats, onFinish, onQuit }: { def: ExerciseDef; level: number; stats: QStats; onFinish: (log: LogEntry[], durationS: number) => void; onQuit: () => void }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => def.generate(level, stats), [def, level]);
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<Stage>('gap');
  const [token, setToken] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [multi, setMulti] = useState<number[]>([]);
  const [last, setLast] = useState<LogEntry | null>(null);
  const [left, setLeft] = useState(def.timeLimitS ?? 0);
  const log = useRef<LogEntry[]>([]);
  const t0 = useRef(0);
  const started = useRef(performance.now());
  const finished = useRef(false);
  const item = items[idx];

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onFinish(log.current, Math.round((performance.now() - started.current) / 1000));
  };

  const next = () => {
    if (idx + 1 >= items.length) return finish();
    setInput('');
    setMulti([]);
    setIdx(idx + 1);
    setStage('gap');
  };

  const submit = (given: string | null) => {
    if (stage !== 'answer' || finished.current) return;
    const entry: LogEntry = { item, given, ok: isCorrect(item, given), ms: Math.round(performance.now() - t0.current) };
    log.current.push(entry);
    if (def.silent) return next(); // mode examen : pas de correction immédiate
    setLast(entry);
    setStage('feedback');
  };

  // Exercices à durée fixe : la séance s'arrête quand le temps est écoulé.
  useEffect(() => {
    if (!def.timeLimitS) return;
    const t = window.setInterval(() => {
      const remaining = def.timeLimitS! - (performance.now() - started.current) / 1000;
      setLeft(Math.max(0, Math.ceil(remaining)));
      if (remaining <= 0) finish();
    }, 250);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    if (stage === 'gap') {
      later(() => setStage(item.memorize ? 'memorize' : item.observeMs ? 'observe' : 'answer'), def.timeLimitS ? 80 : 220);
    } else if (stage === 'memorize' && item.memorize) {
      const { tokens, perTokenMs } = item.memorize;
      tokens.forEach((t, i) => {
        later(() => setToken(t), 400 + i * perTokenMs);
        later(() => setToken(null), 400 + i * perTokenMs + perTokenMs * 0.8);
      });
      later(() => setStage('answer'), 400 + tokens.length * perTokenMs + 200);
    } else if (stage === 'observe') {
      later(next, item.observeMs ?? 1500);
    } else if (stage === 'answer') {
      t0.current = performance.now();
      if (item.limitMs) later(() => submit(null), item.limitMs);
    } else if (stage === 'feedback' && last) {
      // Bonne réponse : enchaînement automatique. Erreur hors tâche de cadence : l'utilisateur lit la correction.
      if (last.ok) later(next, def.fast ? 250 : 450);
      else if (def.fast) later(next, def.timeLimitS ? 500 : 800);
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, idx]);

  const scoredTotal = items.filter((i) => i.kind !== 'none').length;
  const maxLen = item.kind === 'numeric' ? Math.max(item.answer.length + 2, 4) : 0;
  // Figures et propositions courtes : plusieurs colonnes. Phrases : une colonne, plus lisible.
  const cols = item.choices?.every((c) => c.cell) ? 'three'
    : item.choices?.every((c) => c.figure || (c.label ?? '').length <= 16) ? 'two' : '';
  const reading = (stage === 'answer' || stage === 'observe') && !!item.passage;
  const toggle = (i: number) => setMulti((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]));
  const plain = !(item.grid || item.pair || item.figure || item.memorize || item.qid || item.dials || item.matrix || item.kind === 'multi' && item.lines);

  return (
    <div className="run">
      <div className="runbar">
        <button onClick={onQuit}>Quitter</button>
        {def.timeLimitS ? (
          <>
            <div className="progress"><i style={{ width: `${100 - (left / def.timeLimitS) * 100}%` }} /></div>
            <span className="small">{left >= 100 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : `${left} s`}{def.silent ? ` · ${log.current.length}/${scoredTotal}` : ` · ${log.current.filter((l) => l.ok).length} ✓`}</span>
          </>
        ) : (
          <>
            <div className="progress"><i style={{ width: `${(log.current.length / scoredTotal) * 100}%` }} /></div>
            <span className="small">{log.current.length}/{scoredTotal}</span>
          </>
        )}
      </div>

      <div className={`stage ${reading ? 'reading' : ''}`}>
        {stage === 'gap' && <div style={{ height: 150 }} />}
        {reading && <div className="passage">{item.passage}</div>}

        {stage === 'memorize' && (
          <>
            <p className="muted">Mémorisez</p>
            <div className="bigstim">{token ?? ''}</div>
          </>
        )}

        {(stage === 'observe' || stage === 'answer') && (
          <>
            {item.lines && (
              <div className="lines">{item.lines.map((l, i) => <div key={i}>{l}</div>)}</div>
            )}
            {item.big ? (
              <>
                <div className={`bigstim ${item.tint ?? ''}`}>{item.prompt}</div>
                {item.sub && <p className="muted">{item.sub}</p>}
              </>
            ) : (
              <>
                <p className={`prompt ${plain ? '' : 'q'} ${item.kind === 'multi' && !item.lines ? 'expr' : ''}`}>{item.prompt}</p>
                {item.sub && <p className="muted">{item.sub}</p>}
              </>
            )}
            {item.grid && (
              <div className="symgrid" style={{ gridTemplateColumns: `repeat(${item.grid[0].length}, 1.4em)` }}>
                {item.grid.flat().map((s, i) => <span key={i}>{s}</span>)}
              </div>
            )}
            {item.pair && <div className="pair">{item.pair[0]}<br />{item.pair[1]}</div>}
            {item.figure && <FigureView figure={item.figure} size={130} />}
            {item.dials && (
              <div className="row" style={{ gap: 6 }}>
                {item.dials.map((d, i) => <Dial key={i} dial={d} size={item.dials!.length > 3 ? 82 : 100} />)}
              </div>
            )}
            {item.matrix && (
              <div className="matrix">
                {[...item.matrix, null].map((c, i) => <MatrixCell key={i} cell={c} size={70} />)}
              </div>
            )}
            {stage === 'answer' && item.limitMs && (
              <div className="limit"><i key={idx} style={{ animationDuration: `${item.limitMs}ms` }} /></div>
            )}
            {stage === 'answer' && item.kind === 'numeric' && <div className="answer">{input.replace('-', '−')}</div>}
          </>
        )}

        {stage === 'feedback' && last && (
          <>
            <p className={`fb ${last.ok ? 'ok' : 'bad'}`}>{last.ok ? 'Correct' : 'Incorrect'}</p>
            {!last.ok && (
              <>
                <p className="muted">Votre réponse : {label(item, last.given)}</p>
                <p style={{ fontWeight: 600 }}>{item.explain}</p>
                {!def.fast && <button className="btn" onClick={next}>Continuer</button>}
              </>
            )}
          </>
        )}
      </div>

      <div className="pad">
        {stage === 'answer' && item.kind === 'numeric' && (
          <Keypad
            onKey={(d) => setInput((v) => (v.length < maxLen ? v + d : v))}
            onDel={() => setInput((v) => v.slice(0, -1))}
            onSign={item.signed ? () => setInput((v) => (v.startsWith('-') ? v.slice(1) : `-${v}`)) : undefined}
            onOk={() => submit(input)}
            okDisabled={input === '' || input === '-'}
          />
        )}
        {stage === 'answer' && item.kind === 'choice' && item.choices && (
          <div className={`choices ${cols}`}>
            {item.choices.map((c, i) => (
              <button key={i} onClick={() => submit(String(i))}>
                {c.figure ? <FigureView figure={c.figure} size={96} /> : c.cell ? <MatrixCell cell={c.cell} size={72} /> : c.label}
              </button>
            ))}
          </div>
        )}
        {stage === 'answer' && item.kind === 'multi' && item.choices && (
          <div className="stack">
            <div className="choices two">
              {item.choices.map((c, i) => (
                <button key={i} className={multi.includes(i) ? 'sel' : ''} onClick={() => toggle(i)}>{c.label}</button>
              ))}
            </div>
            <div className={item.allowNone ? 'grid2' : ''}>
              {item.allowNone && <button className="btn ghost" onClick={() => submit('none')}>Aucun</button>}
              <button className="btn block" disabled={!multi.length} onClick={() => submit([...multi].sort((x, y) => x - y).join(','))}>Valider</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface Summary { result: Result; decision: LevelDecision | null; previousLevel: number }

export default function Run() {
  const { id = '' } = useParams();
  const isBia = id.startsWith('bia:');
  const bia = useLiveQuery(async () => (isBia ? { pack: await loadPack(), srs: await loadSrs() } : null), [id]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const def: ExerciseDef | undefined = useMemo(() => (isBia ? (bia ? biaExercise(id, bia.pack, bia.srs) : undefined) : getExercise(id)), [id, bia]);
  const nav = useNavigate();
  const storedLevel = useLiveQuery(async () => (await db.levels.get(id))?.level ?? 1, [id]);
  const todayResults = useLiveQuery(() => db.results.where('source').equals('app').toArray(), []);
  const plan = useLiveQuery(async () => (await db.kv.get(`plan:${dayKey()}`))?.value as DayPlan | undefined, []);
  const [phase, setPhase] = useState<'intro' | 'run' | 'done'>('intro');
  const [level, setLevel] = useState(1);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [stats, setStats] = useState<QStats>({});

  useEffect(() => { setPhase('intro'); setSummary(null); }, [id]);

  if (isBia && bia === undefined) return <div className="run" />;
  if (!def) {
    return <div className="page"><p>Exercice introuvable.</p><Link className="btn" to="/train">Retour</Link></div>;
  }

  const start = async () => {
    setStats(((await db.kv.get('qstats'))?.value as QStats | undefined) ?? {});
    setLevel(storedLevel ?? 1);
    setRunKey((k) => k + 1);
    setPhase('run');
  };

  const finish = async (log: LogEntry[], durationS: number) => {
    const correct = log.filter((l) => l.ok).length;
    const errors: ErrorItem[] = log.filter((l) => !l.ok).map((l) => ({
      prompt: l.item.memorize ? `Suite : ${l.item.memorize.tokens.join(' ')}`
        : l.item.pair ? l.item.pair.join(' / ')
        : l.item.lines ? l.item.lines.join(' ; ')
        : l.item.prompt,
      given: label(l.item, l.given),
      expected: label(l.item, l.item.answer),
      explain: l.item.explain,
    }));
    const tagged = log.filter((l) => l.item.tag);
    let breakdown: Record<string, [number, number]> | undefined;
    if (def.silent && tagged.length) {
      breakdown = {};
      for (const l of tagged) {
        const [ok, n] = breakdown[l.item.tag!] ?? [0, 0];
        breakdown[l.item.tag!] = [ok + (l.ok ? 1 : 0), n + 1];
      }
    }
    const result: Result = {
      date: new Date().toISOString(),
      source: 'app',
      exerciseId: def.id,
      exerciseName: def.name,
      category: def.category,
      level: def.noLevel ? undefined : level,
      correct,
      wrong: log.length - correct,
      total: log.length,
      scorePct: log.length ? Math.round((correct / log.length) * 100) : 0,
      medianMs: Math.round(median(log.filter((l) => l.given !== null).map((l) => l.ms))),
      durationS,
      errors,
      breakdown,
    };
    await db.results.add(result);
    // suivi par question (quiz) : les questions ratées reviendront en priorité
    const asked = log.filter((l) => l.item.qid);
    if (asked.length) {
      const qs = ((await db.kv.get('qstats'))?.value as QStats | undefined) ?? {};
      for (const l of asked) {
        const [seen, ok] = qs[l.item.qid!] ?? [0, 0];
        qs[l.item.qid!] = [seen + 1, ok + (l.ok ? 1 : 0)];
      }
      await db.kv.put({ key: 'qstats', value: qs });
    }
    if (isBia && asked.length) await recordSrs(asked.map((l) => ({ qid: l.item.qid!, ok: l.ok })));
    if (def.noLevel) {
      setSummary({ result, decision: null, previousLevel: level });
      setPhase('done');
      return;
    }
    const history = (await db.results.where('exerciseId').equals(def.id).toArray())
      .filter((r) => r.source === 'app')
      .sort((a, b) => b.date.localeCompare(a.date));
    const decision = decideLevel(def, level, history);
    await db.levels.put({ exerciseId: def.id, level: decision.level, changedAt: new Date().toISOString(), reason: decision.reason });
    setSummary({ result, decision, previousLevel: level });
    setPhase('done');
  };

  if (phase === 'run') {
    return <Session key={runKey} def={def} level={level} stats={stats} onFinish={finish} onQuit={() => setPhase('intro')} />;
  }

  const nextId = nextInPlan(plan, doneToday(todayResults ?? []));

  return (
    <div className="run">
      <div className="runbar">
        <button onClick={() => nav(-1)}>‹ Retour</button>
        <span style={{ fontWeight: 650 }}>{def.name}</span>
      </div>
      {phase === 'intro' && (
        <div className="page">
          <div className="card stack">
            <div className="row between"><h2 style={{ margin: 0 }}>Règles</h2>{!def.noLevel && <span className="badge">Niveau {storedLevel ?? '…'}</span>}</div>
            <p>{def.rules}</p>
            <p className="muted">Durée estimée : environ {def.estMinutes} min. Quitter en cours de route n’enregistre rien.</p>
          </div>
          <button className="btn block" onClick={() => void start()} disabled={storedLevel === undefined}>Commencer</button>
        </div>
      )}
      {phase === 'done' && summary && (
        <div className="page">
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="score">{summary.result.correct}/{summary.result.total}</div>
            {def.silent && summary.result.total ? (
              <p style={{ fontWeight: 650 }}>Note : {(((summary.result.correct ?? 0) / summary.result.total) * 20).toFixed(1).replace('.', ',')} / 20</p>
            ) : null}
            {def.timeLimitS && <p className="muted">{summary.result.correct} bonnes réponses en {def.timeLimitS} secondes</p>}
            <p className="muted">
              Précision {summary.result.scorePct} % · temps médian {fmtSec(summary.result.medianMs ?? 0)}{summary.decision ? ` · niveau ${summary.previousLevel}` : ''}
            </p>
          </div>
          {summary.result.breakdown && (
            <div className="card">
              <h2>Par matière</h2>
              <div className="list">
                {Object.entries(summary.result.breakdown).map(([name, [ok, n]]) => (
                  <div className="item" key={name}>
                    <span className="grow title">{name}</span>
                    <span className={`badge ${ok / n >= 0.8 ? 'ok' : ok / n < 0.5 ? 'warn' : ''}`}>{ok}/{n}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {summary.decision ? (
            <div className="card stack">
              <div className="row between">
                <h2 style={{ margin: 0 }}>Adaptation</h2>
                <span className={`badge ${summary.decision!.level > summary.previousLevel ? 'ok' : summary.decision!.level < summary.previousLevel ? 'warn' : ''}`}>
                  Prochain niveau : {summary.decision!.level}
                </span>
              </div>
              <p>{summary.decision!.reason}</p>
            </div>
          ) : (
            <div className="card"><p className="muted">Les questions ratées ou jamais vues reviendront en priorité au prochain quiz.</p></div>
          )}
          {summary.result.errors && summary.result.errors.length > 0 && (
            <div className="card">
              <h2>Erreurs à revoir ({summary.result.errors.length})</h2>
              <div className="list">
                {summary.result.errors.map((e, i) => (
                  <div className="item" key={i} style={{ display: 'block' }}>
                    <p className="title">{e.prompt}</p>
                    <p className="muted">Votre réponse : {e.given}</p>
                    <p className="small">{e.explain}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {nextId && nextId !== def.id && (
            <Link className="btn block" to={`/run/${nextId}`} replace>Exercice suivant : {getExercise(nextId)?.name}</Link>
          )}
          <div className="grid2">
            <button className="btn ghost" onClick={() => void start()}>Recommencer</button>
            <Link className="btn ghost" to="/">Terminer</Link>
          </div>
        </div>
      )}
    </div>
  );
}
