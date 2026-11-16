import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { QStats } from '../content/quiz';
import { db, type Result } from '../db';
import {
  allParts, type BiaPack, dueIds, EXAM, findPart, importPack, loadPack, loadRead, loadSrs,
  partRate, partStatus, removePack, type Status, STATUS_LABEL, toggleRead,
} from '../domain/bia';
import { fmtDate, pct, Sparkline } from '../ui';

const BADGE: Record<Status, string> = { none: '', progress: 'warn', reviewed: '', mastered: 'ok' };

function useBia() {
  const pack = useLiveQuery(async () => ({ value: await loadPack() }), []);
  const read = useLiveQuery(loadRead, []);
  const srs = useLiveQuery(loadSrs, []);
  const stats = useLiveQuery(async () => ((await db.kv.get('qstats'))?.value as QStats | undefined) ?? {}, []);
  const results = useLiveQuery(
    async () => (await db.results.where('category').equals('bia').toArray()).sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );
  return { pack: pack?.value, loading: pack === undefined, read: read ?? {}, srs: srs ?? {}, stats: stats ?? {}, results: results ?? [] };
}

function Import({ current }: { current: BiaPack | null }) {
  const ref = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(false);
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const r = await importPack(await file.text());
      setMsg(`Pack importé : ${r.chapters} matière${r.chapters > 1 ? 's' : ''}, ${r.questions} questions.`); setErr('');
    } catch (e) { setErr((e as Error).message); setMsg(''); }
    if (ref.current) ref.current.value = '';
  };
  return (
    <div className="card stack">
      <h2>{current ? 'Pack de contenus' : 'Importer un pack BIA'}</h2>
      {current ? (
        <p className="muted">{current.title}. Source : {current.source}. Généré le {fmtDate(current.generatedAt)}.</p>
      ) : (
        <p className="muted">
          Les fiches et les questions du BIA ne sont pas dans l’application : elles arrivent dans un fichier « pack » rédigé à partir de ton
          livret. Enregistre le fichier sur ton téléphone (Fichiers), puis importe-le ici. Il reste sur cet appareil.
        </p>
      )}
      <input ref={ref} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
      <button className={`btn ${current ? 'ghost' : ''}`} onClick={() => ref.current?.click()}>
        {current ? 'Importer une autre matière ou une mise à jour' : 'Choisir le fichier'}
      </button>
      {current && (
        <button className="btn danger sm" style={{ alignSelf: 'flex-start' }} onClick={async () => {
          if (!confirm) return setConfirm(true);
          await removePack(); setConfirm(false);
        }}>
          {confirm ? 'Confirmer : retirer tout le pack (les résultats sont conservés)' : 'Retirer le pack'}
        </button>
      )}
      {msg && <p className="badge ok" style={{ alignSelf: 'flex-start', whiteSpace: 'normal' }}>{msg}</p>}
      {err && <p className="error">{err}</p>}
    </div>
  );
}

const quizzesOf = (results: Result[], partId: string) => results.filter((r) => r.exerciseId === `bia:part:${partId}`);

export function BiaHome() {
  const { pack, loading, read, srs, stats, results } = useBia();
  if (loading) return null;

  if (!pack) {
    return (
      <div className="app">
        <header className="top"><h1>Préparation BIA</h1><p>Fiches, questionnaires et examens blancs</p></header>
        <main className="page"><Import current={null} /></main>
      </div>
    );
  }

  const parts = allParts(pack);
  const status = (partId: string) => {
    const p = parts.find((x) => x.part.id === partId)!.part;
    return partStatus(p, !!read[partId], stats, quizzesOf(results, partId));
  };
  const counts = { none: 0, progress: 0, reviewed: 0, mastered: 0 } as Record<Status, number>;
  for (const { part } of parts) counts[status(part.id)]++;
  const known = new Set(parts.flatMap(({ part }) => part.questions.map((q) => q.id)));
  const due = dueIds(srs).filter((id) => known.has(id)).length;
  const exams = results.filter((r) => r.exerciseId === 'bia:exam');
  const nExam = pack.chapters.reduce((s, c) => s + Math.min(EXAM.perChapter, c.parts.reduce((t, p) => t + p.questions.length, 0)), 0);
  const worked = counts.reviewed + counts.mastered;

  return (
    <div className="app">
      <header className="top">
        <h1>Préparation BIA</h1>
        <p>{pack.chapters.length} matière{pack.chapters.length > 1 ? 's' : ''} sur 5 importée{pack.chapters.length > 1 ? 's' : ''} · {known.size} questions</p>
      </header>
      <main className="page">
        <div className="grid3">
          <div className="kpi"><b>{Math.round((worked / parts.length) * 100)} %</b><span>parties révisées ou maîtrisées</span></div>
          <div className="kpi"><b>{counts.mastered}/{parts.length}</b><span>parties maîtrisées</span></div>
          <div className="kpi"><b>{due}</b><span>révision{due > 1 ? 's' : ''} due{due > 1 ? 's' : ''}</span></div>
        </div>

        <div className="card stack">
          <h2>S’entraîner</h2>
          {due > 0 ? (
            <Link className="btn block" to="/run/bia:due">Révisions du jour ({Math.min(20, due)})</Link>
          ) : (
            <p className="muted">Aucune révision due aujourd’hui. Les questions déjà vues reviennent après 1, 3, 7, 14 puis 30 jours.</p>
          )}
          <div className="grid2">
            <Link className="btn ghost" to="/run/bia:all">Aléatoire (20)</Link>
            <Link className="btn ghost" to="/run/bia:exam">Examen blanc ({nExam})</Link>
          </div>
        </div>

        {pack.chapters.map((c) => (
          <div className="card" key={c.id}>
            <div className="row between">
              <h2 style={{ margin: 0 }}>{c.title}</h2>
              <Link className="btn ghost sm" to={`/run/bia:chap:${c.id}`}>Quiz matière</Link>
            </div>
            <div className="list">
              {c.parts.map((part) => {
                const st = status(part.id);
                const rate = partRate(part, stats);
                return (
                  <Link className="item" key={part.id} to={`/bia/${part.id}`}>
                    <span className="grow">
                      <span className="title">{part.title}</span>
                      <span className="muted" style={{ display: 'block' }}>
                        {part.questions.length} questions · {rate === null ? 'pas encore de réponse' : `réussite ${pct(rate)}`}
                      </span>
                    </span>
                    <span className={`badge ${BADGE[st]}`}>{STATUS_LABEL[st]}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {exams.length > 0 && (
          <div className="card">
            <h2>Examens blancs</h2>
            <div className="row between">
              <span className="muted">
                {exams.length} passé{exams.length > 1 ? 's' : ''} · dernier : {exams[0].correct}/{exams[0].total}, soit{' '}
                {(((exams[0].correct ?? 0) / (exams[0].total || 1)) * 20).toFixed(1).replace('.', ',')}/20
              </span>
              <Sparkline values={[...exams].reverse().map((r) => (r.total ? (r.correct ?? 0) / r.total : 0))} guide={0.5} />
            </div>
            <p className="muted small">Courbe : part de bonnes réponses, du plus ancien au plus récent. Pointillé = 10/20.</p>
          </div>
        )}

        <div className="card">
          <h2>Comment lire les statuts</h2>
          <p className="muted small">
            En cours : fiche lue ou un questionnaire fait. Révisé : fiche lue et toutes les questions vues. Maîtrisé : toutes les questions
            vues et les trois derniers questionnaires de la partie à 80 % ou plus, sur au moins deux jours différents. Lire une fiche ne
            suffit jamais à valider une partie.
          </p>
        </div>
        <Import current={pack} />
      </main>
    </div>
  );
}

export function BiaPartView() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { pack, loading, read, stats, results } = useBia();
  if (loading) return null;
  const found = pack ? findPart(pack, id) : undefined;
  if (!found) return <div className="page"><p>Partie introuvable.</p><Link className="btn" to="/bia">Retour</Link></div>;
  const { chapter, part } = found;
  const quizzes = quizzesOf(results, part.id);
  const st = partStatus(part, !!read[part.id], stats, quizzes);
  // questions le plus souvent ratées (au moins deux passages)
  const weak = part.questions
    .map((q) => ({ q, s: stats[q.id] }))
    .filter((x) => x.s && x.s[0] >= 2 && x.s[1] / x.s[0] < 0.5)
    .sort((a, b) => a.s![1] / a.s![0] - b.s![1] / b.s![0])
    .slice(0, 5);

  return (
    <div className="app">
      <header className="top">
        <button onClick={() => nav('/bia')} style={{ background: 'none', border: 0, color: '#b9c6dc', padding: 0, fontSize: 14 }}>‹ {chapter.title}</button>
        <h1 style={{ marginTop: 4 }}>{part.title}</h1>
        <p>Livret p. {part.pages[0]} à {part.pages[1]} · {STATUS_LABEL[st]}</p>
      </header>
      <main className="page">
        <div className="grid2">
          <Link className="btn" to={`/run/bia:part:${part.id}`}>Questionnaire</Link>
          <button className="btn ghost" onClick={() => void toggleRead(part.id)}>{read[part.id] ? '✓ Fiche lue' : 'Marquer comme lue'}</button>
        </div>
        <div className="card fiche">
          {part.sections.map((s, i) => (
            <div key={i}>
              <h3>{s.title}{s.origin === 'externe' ? ' (complément hors livret)' : ''}</h3>
              <ul>{s.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
              {s.origin === 'externe' && s.ref && <p className="muted small" style={{ marginTop: 4 }}>Source : {s.ref}</p>}
            </div>
          ))}
        </div>
        {part.notes && part.notes.length > 0 && (
          <div className="card fiche">
            <h2>Signalements sur le livret</h2>
            <ul>{part.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
        )}
        {weak.length > 0 && (
          <div className="card fiche">
            <h2>Questions que tu rates souvent</h2>
            <ul>{weak.map(({ q, s }) => <li key={q.id}>{q.q} <span className="muted">({s![1]}/{s![0]}) — {q.choices[0]}</span></li>)}</ul>
          </div>
        )}
        {quizzes.length > 0 && (
          <div className="card">
            <div className="row between">
              <span className="muted">{quizzes.length} questionnaire{quizzes.length > 1 ? 's' : ''} · dernier : {quizzes[0].correct}/{quizzes[0].total}</span>
              <Sparkline values={[...quizzes].reverse().map((r) => (r.total ? (r.correct ?? 0) / r.total : 0))} guide={0.8} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
