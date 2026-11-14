import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { CATEGORIES, type CategoryId, db, type Result, type Source, SOURCES } from '../db';
import { accuracy, exerciseStats, levelOf } from '../domain/adaptive';
import { byCategory } from '../exercises/registry';
import { fmtDate, fmtMin, fmtSec, pct, Sparkline } from '../ui';

type TabId = 'synthese' | 'historique' | 'saisie';

function Synthese({ results }: { results: Result[] }) {
  const levels = useLiveQuery(() => db.levels.toArray(), []);
  const app = results.filter((r) => r.source === 'app');
  const ext = results.filter((r) => r.source !== 'app');
  const seconds = (rs: Result[]) => rs.reduce((s, r) => s + (r.durationS ?? 0), 0);

  if (!results.length) {
    return <div className="card"><p className="muted">Aucun résultat enregistré pour l’instant. Les statistiques apparaîtront après votre première séance.</p></div>;
  }

  return (
    <>
      <div className="grid3">
        <div className="kpi"><b>{app.length}</b><span>séance{app.length > 1 ? 's' : ''} dans l’app</span></div>
        <div className="kpi"><b>{ext.length}</b><span>{ext.length > 1 ? 'résultats externes' : 'résultat externe'}</span></div>
        <div className="kpi"><b>{fmtMin(seconds(results))}</b><span>temps enregistré</span></div>
      </div>

      {(Object.keys(CATEGORIES) as CategoryId[]).map((cat) => {
        const defs = byCategory(cat);
        const catResults = app.filter((r) => r.category === cat);
        if (!catResults.length) return null;
        return (
          <div className="card" key={cat}>
            <h2>{CATEGORIES[cat]}</h2>
            <p className="muted small" style={{ marginBottom: 6 }}>Courbes : précision par séance, de la plus ancienne à la plus récente. Pointillé = seuil de 85 %.</p>
            <div className="list">
              {defs.map((def) => {
                const hist = catResults.filter((r) => r.exerciseId === def.id); // tri : plus récent d'abord
                if (!hist.length) return null;
                const st = exerciseStats(hist);
                const best = Math.max(...hist.map(accuracy));
                const lvl = levels?.find((l) => l.exerciseId === def.id);
                return (
                  <div className="item" key={def.id} style={{ display: 'block' }}>
                    <div className="row between">
                      <span className="title">{def.name}</span>
                      <span className="badge">Niv. {levelOf(levels, def.id)}</span>
                    </div>
                    <div className="row between" style={{ marginTop: 4 }}>
                      <span className="muted">
                        {st.sessions} séance{st.sessions > 1 ? 's' : ''} · récente {pct(st.recentAcc ?? 0)} · meilleure {pct(best)}
                        {hist[0].medianMs ? ` · médiane ${fmtSec(hist[0].medianMs)}` : ''}
                      </span>
                      <Sparkline values={[...hist].reverse().slice(-20).map(accuracy)} guide={0.85} />
                    </div>
                    {lvl?.reason && <p className="small muted" style={{ marginTop: 4 }}>↳ {lvl.reason}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {(['pilotest', 'epltest'] as Source[]).map((src) => {
        const rs = ext.filter((r) => r.source === src);
        if (!rs.length) return null;
        const names = [...new Set(rs.map((r) => r.exerciseName))];
        return (
          <div className="card" key={src}>
            <h2>{SOURCES[src]}</h2>
            <p className="muted small" style={{ marginBottom: 6 }}>
              Résultats saisis manuellement, présentés tels quels. Ils ne sont ni convertis ni additionnés à ceux de l’app.
            </p>
            <div className="list">
              {names.map((name) => {
                const hist = rs.filter((r) => r.exerciseName === name);
                const last = hist[0];
                const metric: { key: 'scorePct' | 'stanine' | 'percentile'; label: string; max: number } | null =
                  hist.filter((r) => r.scorePct !== undefined).length >= 2 ? { key: 'scorePct', label: 'score %', max: 100 }
                  : hist.filter((r) => r.stanine !== undefined).length >= 2 ? { key: 'stanine', label: 'stanine (1-9)', max: 9 }
                  : hist.filter((r) => r.percentile !== undefined).length >= 2 ? { key: 'percentile', label: 'percentile', max: 100 }
                  : null;
                return (
                  <div className="item" key={name} style={{ display: 'block' }}>
                    <span className="title">{name}</span>
                    <div className="row between" style={{ marginTop: 4 }}>
                      <span className="muted">
                        {hist.length} essai{hist.length > 1 ? 's' : ''} · dernier le {fmtDate(last.date)}
                        {last.scorePct !== undefined ? ` · ${last.scorePct} %` : ''}
                        {last.stanine !== undefined ? ` · stanine ${last.stanine}` : ''}
                        {last.percentile !== undefined ? ` · percentile ${last.percentile}` : ''}
                      </span>
                      {metric && (
                        <span style={{ textAlign: 'right' }}>
                          <Sparkline values={[...hist].reverse().filter((r) => r[metric.key] !== undefined).map((r) => (r[metric.key] as number) / metric.max)} />
                          <span className="muted small" style={{ display: 'block' }}>{metric.label}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

function Historique({ results }: { results: Result[] }) {
  const [source, setSource] = useState<'all' | Source>('all');
  const [cat, setCat] = useState<'all' | CategoryId | 'autre'>('all');
  const [open, setOpen] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const shown = results.filter((r) => (source === 'all' || r.source === source) && (cat === 'all' || r.category === cat));

  return (
    <>
      <div className="grid2">
        <label className="field">Plateforme
          <select value={source} onChange={(e) => setSource(e.target.value as 'all' | Source)}>
            <option value="all">Toutes</option>
            {(Object.keys(SOURCES) as Source[]).map((s) => <option key={s} value={s}>{SOURCES[s]}</option>)}
          </select>
        </label>
        <label className="field">Domaine
          <select value={cat} onChange={(e) => setCat(e.target.value as 'all' | CategoryId | 'autre')}>
            <option value="all">Tous</option>
            {(Object.keys(CATEGORIES) as CategoryId[]).map((c) => <option key={c} value={c}>{CATEGORIES[c]}</option>)}
            <option value="autre">Autre</option>
          </select>
        </label>
      </div>
      <div className="card">
        {!shown.length && <p className="muted">Aucun résultat pour ces filtres.</p>}
        <div className="list">
          {shown.slice(0, 200).map((r) => (
            <div className="item" key={r.id} style={{ display: 'block' }}>
              <div className="row between" onClick={() => setOpen(open === r.id ? null : r.id!)}>
                <span className="grow">
                  <span className="title">{r.exerciseName}</span>
                  <span className="muted" style={{ display: 'block' }}>
                    {fmtDate(r.date)} · {SOURCES[r.source]}
                    {r.level ? ` · niv. ${r.level}` : ''}{r.difficulty ? ` · ${r.difficulty}` : ''}
                  </span>
                </span>
                <span className="badge">
                  {r.total ? `${r.correct}/${r.total}` : r.scorePct !== undefined ? `${r.scorePct} %` : r.stanine !== undefined ? `St. ${r.stanine}` : '—'}
                </span>
              </div>
              {open === r.id && (
                <div className="stack" style={{ marginTop: 8 }}>
                  <p className="small muted">
                    {[
                      r.scorePct !== undefined && `score ${r.scorePct} %`,
                      r.correct !== undefined && `${r.correct} bonnes`,
                      r.wrong !== undefined && `${r.wrong} mauvaises`,
                      r.medianMs && `médiane ${fmtSec(r.medianMs)}`,
                      r.durationS && `durée ${fmtMin(r.durationS)}`,
                      r.percentile !== undefined && `percentile ${r.percentile}`,
                      r.stanine !== undefined && `stanine ${r.stanine}`,
                    ].filter(Boolean).join(' · ')}
                  </p>
                  {r.comment && <p className="small">« {r.comment} »</p>}
                  {r.errors?.map((e, i) => (
                    <p className="small" key={i}><b>{e.prompt}</b> — réponse : {e.given}. {e.explain}</p>
                  ))}
                  {confirm === r.id ? (
                    <div className="row">
                      <button className="btn danger sm" onClick={() => void db.results.delete(r.id!)}>Confirmer la suppression</button>
                      <button className="btn ghost sm" onClick={() => setConfirm(null)}>Annuler</button>
                    </div>
                  ) : (
                    <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirm(r.id!)}>Supprimer ce résultat</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {shown.length > 200 && <p className="muted small">200 résultats les plus récents affichés sur {shown.length}.</p>}
      </div>
    </>
  );
}

const num = (v: string): number | undefined => (v.trim() === '' || Number.isNaN(Number(v.replace(',', '.'))) ? undefined : Number(v.replace(',', '.')));

function Saisie({ onSaved }: { onSaved: () => void }) {
  const names = useLiveQuery(async () => [...new Set((await db.results.toArray()).filter((r) => r.source !== 'app').map((r) => r.exerciseName))], []);
  const today = new Date().toLocaleDateString('sv');
  const [f, setF] = useState({
    source: 'pilotest' as Source, name: '', date: today, category: 'autre' as CategoryId | 'autre',
    correct: '', wrong: '', score: '', minutes: '', percentile: '', stanine: '', difficulty: '', comment: '',
  });
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    const stanine = num(f.stanine), percentile = num(f.percentile), score = num(f.score);
    if (!f.name.trim()) return setError('Indiquez le nom de l’exercice.');
    if (stanine !== undefined && (stanine < 1 || stanine > 9 || !Number.isInteger(stanine))) return setError('La classe Stanine est un entier de 1 à 9.');
    if (percentile !== undefined && (percentile < 0 || percentile > 100)) return setError('Le percentile est compris entre 0 et 100.');
    if (score !== undefined && (score < 0 || score > 100)) return setError('Le score est un pourcentage entre 0 et 100.');
    const correct = num(f.correct), wrong = num(f.wrong), minutes = num(f.minutes);
    const now = new Date();
    const date = new Date(`${f.date}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`);
    await db.results.add({
      date: date.toISOString(), source: f.source, exerciseId: `${f.source}:${f.name.trim().toLowerCase()}`,
      exerciseName: f.name.trim(), category: f.category,
      correct, wrong, total: correct !== undefined && wrong !== undefined ? correct + wrong : undefined,
      scorePct: score, durationS: minutes !== undefined ? Math.round(minutes * 60) : undefined,
      percentile, stanine, difficulty: f.difficulty.trim() || undefined, comment: f.comment.trim() || undefined,
    });
    onSaved();
  };

  return (
    <div className="card stack">
      <h2>Résultat Pilotest / EPL Test</h2>
      <p className="muted">Seuls la plateforme et le nom sont obligatoires : renseignez ce que l’épreuve fournit.</p>
      <div className="seg">
        {(['pilotest', 'epltest'] as Source[]).map((s) => (
          <button key={s} className={f.source === s ? 'on' : ''} onClick={() => setF({ ...f, source: s })}>{SOURCES[s]}</button>
        ))}
      </div>
      <label className="field">Nom de l’exercice
        <input list="ext-names" value={f.name} onChange={set('name')} placeholder="Tel qu’affiché sur la plateforme" />
        <datalist id="ext-names">{names?.map((n) => <option key={n} value={n} />)}</datalist>
      </label>
      <div className="grid2">
        <label className="field">Date<input type="date" value={f.date} max={today} onChange={set('date')} /></label>
        <label className="field">Domaine
          <select value={f.category} onChange={set('category')}>
            <option value="autre">Autre / mixte</option>
            {(Object.keys(CATEGORIES) as CategoryId[]).map((c) => <option key={c} value={c}>{CATEGORIES[c]}</option>)}
          </select>
        </label>
        <label className="field">Bonnes réponses<input inputMode="numeric" value={f.correct} onChange={set('correct')} /></label>
        <label className="field">Mauvaises réponses<input inputMode="numeric" value={f.wrong} onChange={set('wrong')} /></label>
        <label className="field">Score (%)<input inputMode="decimal" value={f.score} onChange={set('score')} /></label>
        <label className="field">Temps (min)<input inputMode="decimal" value={f.minutes} onChange={set('minutes')} /></label>
        <label className="field">Percentile<input inputMode="decimal" value={f.percentile} onChange={set('percentile')} /></label>
        <label className="field">Stanine (1-9)<input inputMode="numeric" value={f.stanine} onChange={set('stanine')} /></label>
      </div>
      <label className="field">Difficulté<input value={f.difficulty} onChange={set('difficulty')} placeholder="Ex. : niveau 3, mode examen" /></label>
      <label className="field">Commentaire<textarea rows={2} value={f.comment} onChange={set('comment')} /></label>
      {error && <p className="error">{error}</p>}
      <button className="btn block" onClick={() => void save()}>Enregistrer</button>
    </div>
  );
}

export default function Progress() {
  const [tab, setTab] = useState<TabId>('synthese');
  const results = useLiveQuery(async () => (await db.results.toArray()).sort((a, b) => b.date.localeCompare(a.date)), []);

  return (
    <div className="app">
      <header className="top">
        <h1>Progression</h1>
        <p>Résultats de l’app et des plateformes, sans les mélanger</p>
      </header>
      <main className="page">
        <div className="seg">
          <button className={tab === 'synthese' ? 'on' : ''} onClick={() => setTab('synthese')}>Synthèse</button>
          <button className={tab === 'historique' ? 'on' : ''} onClick={() => setTab('historique')}>Historique</button>
          <button className={tab === 'saisie' ? 'on' : ''} onClick={() => setTab('saisie')}>Saisie externe</button>
        </div>
        {tab === 'synthese' && <Synthese results={results ?? []} />}
        {tab === 'historique' && <Historique results={results ?? []} />}
        {tab === 'saisie' && <Saisie onSaved={() => setTab('historique')} />}
      </main>
    </div>
  );
}
