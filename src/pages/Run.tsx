import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { dayKey, db, type ErrorItem, type Result } from '../db';
import { decideLevel, type LevelDecision, median } from '../domain/adaptive';
import { doneToday, type DayPlan, nextInPlan } from '../domain/plan';
import { EXERCISES } from '../exercises/registry';
import type { ExerciseDef, Item } from '../exercises/types';
import { FigureView, fmtSec, Keypad } from '../ui';

interface LogEntry { item: Item; given: string | null; ok: boolean; ms: number }
type Stage = 'gap' | 'memorize' | 'observe' | 'answer' | 'feedback';

function isCorrect(item: Item, given: string | null): boolean {
  if (given === null || given === '') return false;
  if (item.kind === 'numeric' && !item.exact) return Number(given) === Number(item.answer);
  return given === item.answer;
}

function label(item: Item, value: string | null): string {
  if (value === null) return 'pas de réponse (temps écoulé)';
  if (item.kind === 'choice') return item.choices?.[Number(value)]?.label ?? `proposition ${Number(value) + 1}`;
  return value;
}

function Session({ def, level, onFinish, onQuit }: { def: ExerciseDef; level: number; onFinish: (log: LogEntry[], durationS: number) => void; onQuit: () => void }) {
  const items = useMemo(() => def.generate(level), [def, level]);
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<Stage>('gap');
  const [token, setToken] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [last, setLast] = useState<LogEntry | null>(null);
  const log = useRef<LogEntry[]>([]);
  const t0 = useRef(0);
  const started = useRef(performance.now());
  const item = items[idx];

  const next = () => {
    if (idx + 1 >= items.length) {
      onFinish(log.current, Math.round((performance.now() - started.current) / 1000));
      return;
    }
    setInput('');
    setIdx(idx + 1);
    setStage('gap');
  };

  const submit = (given: string | null) => {
    if (stage !== 'answer') return;
    const entry: LogEntry = { item, given, ok: isCorrect(item, given), ms: Math.round(performance.now() - t0.current) };
    log.current.push(entry);
    setLast(entry);
    setStage('feedback');
  };

  useEffect(() => {
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    if (stage === 'gap') {
      later(() => setStage(item.memorize ? 'memorize' : item.observeMs ? 'observe' : 'answer'), 220);
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
      else if (def.fast) later(next, 800);
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, idx]);

  const scoredTotal = items.filter((i) => i.kind !== 'none').length;
  const maxLen = item.kind === 'numeric' ? Math.max(item.answer.length + 2, 4) : 0;

  return (
    <div className="run">
      <div className="runbar">
        <button onClick={onQuit}>Quitter</button>
        <div className="progress"><i style={{ width: `${(log.current.length / scoredTotal) * 100}%` }} /></div>
        <span className="small">{log.current.length}/{scoredTotal}</span>
      </div>

      <div className="stage">
        {stage === 'gap' && <div style={{ height: 150 }} />}

        {stage === 'memorize' && (
          <>
            <p className="muted">Mémorisez</p>
            <div className="bigstim">{token ?? ''}</div>
          </>
        )}

        {(stage === 'observe' || stage === 'answer') && (
          <>
            {item.big ? (
              <>
                <div className={`bigstim ${item.tint ?? ''}`}>{item.prompt}</div>
                {item.sub && <p className="muted">{item.sub}</p>}
              </>
            ) : (
              <>
                <p className={`prompt ${item.grid || item.pair || item.figure || item.memorize ? 'q' : ''}`}>{item.prompt}</p>
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
            {stage === 'answer' && item.limitMs && (
              <div className="limit"><i key={idx} style={{ animationDuration: `${item.limitMs}ms` }} /></div>
            )}
            {stage === 'answer' && item.kind === 'numeric' && <div className="answer">{input}</div>}
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
            onOk={() => submit(input)}
            okDisabled={input === ''}
          />
        )}
        {stage === 'answer' && item.kind === 'choice' && item.choices && (
          <div className="choices two">
            {item.choices.map((c, i) => (
              <button key={i} onClick={() => submit(String(i))}>
                {c.figure ? <FigureView figure={c.figure} size={96} /> : c.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface Summary { result: Result; decision: LevelDecision; previousLevel: number }

export default function Run() {
  const { id = '' } = useParams();
  const def: ExerciseDef | undefined = EXERCISES[id];
  const nav = useNavigate();
  const storedLevel = useLiveQuery(async () => (await db.levels.get(id))?.level ?? 1, [id]);
  const todayResults = useLiveQuery(() => db.results.where('source').equals('app').toArray(), []);
  const plan = useLiveQuery(async () => (await db.kv.get(`plan:${dayKey()}`))?.value as DayPlan | undefined, []);
  const [phase, setPhase] = useState<'intro' | 'run' | 'done'>('intro');
  const [level, setLevel] = useState(1);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => { setPhase('intro'); setSummary(null); }, [id]);

  if (!def) {
    return <div className="page"><p>Exercice introuvable.</p><Link className="btn" to="/train">Retour</Link></div>;
  }

  const start = () => {
    setLevel(storedLevel ?? 1);
    setRunKey((k) => k + 1);
    setPhase('run');
  };

  const finish = async (log: LogEntry[], durationS: number) => {
    const correct = log.filter((l) => l.ok).length;
    const errors: ErrorItem[] = log.filter((l) => !l.ok).map((l) => ({
      prompt: l.item.memorize ? `Suite : ${l.item.memorize.tokens.join(' ')}` : l.item.pair ? l.item.pair.join(' / ') : l.item.prompt,
      given: label(l.item, l.given),
      expected: label(l.item, l.item.answer),
      explain: l.item.explain,
    }));
    const result: Result = {
      date: new Date().toISOString(),
      source: 'app',
      exerciseId: def.id,
      exerciseName: def.name,
      category: def.category,
      level,
      correct,
      wrong: log.length - correct,
      total: log.length,
      scorePct: log.length ? Math.round((correct / log.length) * 100) : 0,
      medianMs: Math.round(median(log.filter((l) => l.given !== null).map((l) => l.ms))),
      durationS,
      errors,
    };
    await db.results.add(result);
    const history = (await db.results.where('exerciseId').equals(def.id).toArray())
      .filter((r) => r.source === 'app')
      .sort((a, b) => b.date.localeCompare(a.date));
    const decision = decideLevel(def, level, history);
    await db.levels.put({ exerciseId: def.id, level: decision.level, changedAt: new Date().toISOString(), reason: decision.reason });
    setSummary({ result, decision, previousLevel: level });
    setPhase('done');
  };

  if (phase === 'run') {
    return <Session key={runKey} def={def} level={level} onFinish={finish} onQuit={() => setPhase('intro')} />;
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
            <div className="row between"><h2 style={{ margin: 0 }}>Règles</h2><span className="badge">Niveau {storedLevel ?? '…'}</span></div>
            <p>{def.rules}</p>
            <p className="muted">Durée estimée : environ {def.estMinutes} min. Quitter en cours de route n’enregistre rien.</p>
          </div>
          <button className="btn block" onClick={start} disabled={storedLevel === undefined}>Commencer</button>
        </div>
      )}
      {phase === 'done' && summary && (
        <div className="page">
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="score">{summary.result.correct}/{summary.result.total}</div>
            <p className="muted">
              Précision {summary.result.scorePct} % · temps médian {fmtSec(summary.result.medianMs ?? 0)} · niveau {summary.previousLevel}
            </p>
          </div>
          <div className="card stack">
            <div className="row between">
              <h2 style={{ margin: 0 }}>Adaptation</h2>
              <span className={`badge ${summary.decision.level > summary.previousLevel ? 'ok' : summary.decision.level < summary.previousLevel ? 'warn' : ''}`}>
                Prochain niveau : {summary.decision.level}
              </span>
            </div>
            <p>{summary.decision.reason}</p>
          </div>
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
            <Link className="btn block" to={`/run/${nextId}`} replace>Exercice suivant : {EXERCISES[nextId]?.name}</Link>
          )}
          <div className="grid2">
            <button className="btn ghost" onClick={start}>Recommencer</button>
            <Link className="btn ghost" to="/">Terminer</Link>
          </div>
        </div>
      )}
    </div>
  );
}
