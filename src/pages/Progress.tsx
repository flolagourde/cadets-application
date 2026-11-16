import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATEGORIES, type CategoryId, db, type Result, type Source, SOURCES } from '../db';
import { accuracy, exerciseStats, levelOf } from '../domain/adaptive';
import { byCategory } from '../exercises/registry';
import { fmtDate, fmtMin, fmtSec, pct, Sparkline } from '../ui';
import { Catalogue, Priorites, Saisie } from './External';

type TabId = 'synthese' | 'historique' | 'saisie' | 'tests';

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

export default function Progress() {
  const [params, setParams] = useSearchParams();
  const preset = params.get('test') ?? undefined;
  const [tab, setTab] = useState<TabId>(preset ? 'saisie' : 'synthese');
  const results = useLiveQuery(async () => (await db.results.toArray()).sort((a, b) => b.date.localeCompare(a.date)), []);
  const go = (t: TabId) => { setTab(t); if (preset) setParams({}, { replace: true }); };

  return (
    <div className="app">
      <header className="top">
        <h1>Progression</h1>
        <p>Résultats de l’app et des plateformes, sans les mélanger</p>
      </header>
      <main className="page">
        <div className="seg">
          <button className={tab === 'synthese' ? 'on' : ''} onClick={() => go('synthese')}>Synthèse</button>
          <button className={tab === 'historique' ? 'on' : ''} onClick={() => go('historique')}>Historique</button>
          <button className={tab === 'saisie' ? 'on' : ''} onClick={() => go('saisie')}>Saisie</button>
          <button className={tab === 'tests' ? 'on' : ''} onClick={() => go('tests')}>Tests</button>
        </div>
        {tab === 'synthese' && <><Priorites results={results ?? []} /><Synthese results={results ?? []} /></>}
        {tab === 'historique' && <Historique results={results ?? []} />}
        {tab === 'saisie' && <Saisie key={preset ?? 'libre'} preset={preset} onSaved={() => go('historique')} />}
        {tab === 'tests' && <Catalogue results={results ?? []} />}
      </main>
    </div>
  );
}
