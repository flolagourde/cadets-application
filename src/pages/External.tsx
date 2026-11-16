import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { type CategoryId, db, type ExtTest, type Result, type Source, SOURCES, type Stage, STAGES } from '../db';
import { rankExternal } from '../domain/adaptive';
import { CATALOG_DATE, ensureCatalog, slugify } from '../domain/catalog';
import { fmtDate } from '../ui';

const num = (v: string): number | undefined =>
  v.trim() === '' || Number.isNaN(Number(v.replace(',', '.'))) ? undefined : Number(v.replace(',', '.'));

const STAGE_ORDER: Stage[] = ['psy1', 'psy0', 'autre'];

/** Correspondance entre les aptitudes des plateformes et les domaines de l'app (pour les filtres de l'historique). */
function categoryOf(t: ExtTest | undefined): CategoryId | 'autre' {
  const a = t?.aptitudes[0];
  if (a === 'Numérique') return 'calcul';
  if (a === 'Mémorisation') return 'memoire';
  if (a === 'Attention') return 'attention';
  if (a === 'Intellectuelle') return 'logique';
  if (a === 'Spatiale') return 'spatial';
  if (a === 'Anglais') return 'anglais';
  if (a === 'Connaissances aéronautiques') return 'aero';
  return 'autre';
}

function useCatalog() {
  useEffect(() => { void ensureCatalog(); }, []);
  return useLiveQuery(() => db.extTests.toArray(), []);
}

/** Saisie rapide : test → stanine → Enregistrer. Les autres champs sont facultatifs et repliés. */
export function Saisie({ preset, onSaved }: { preset?: string; onSaved: () => void }) {
  const tests = useCatalog();
  const today = new Date().toLocaleDateString('sv');
  const [testId, setTestId] = useState(preset ?? '');
  const [stanine, setStanine] = useState<number | null>(null);
  const [more, setMore] = useState(false);
  const [f, setF] = useState({
    source: 'pilotest' as Exclude<Source, 'app'>, name: '', date: today,
    correct: '', wrong: '', score: '', minutes: '', percentile: '', difficulty: '', comment: '',
  });
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const free = testId === '__libre';
  const test = tests?.find((t) => t.id === testId);
  const previous = useLiveQuery(
    async () => (testId && !free ? (await db.results.where('exerciseId').equals(testId).toArray()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3) : []),
    [testId],
  );

  const save = async () => {
    const percentile = num(f.percentile), score = num(f.score);
    if (!testId) return setError('Choisis un test.');
    if (free && !f.name.trim()) return setError('Indique le nom du test.');
    if (percentile !== undefined && (percentile < 0 || percentile > 100)) return setError('Le percentile est compris entre 0 et 100.');
    if (score !== undefined && (score < 0 || score > 100)) return setError('Le score est un pourcentage entre 0 et 100.');
    if (stanine === null && score === undefined && num(f.correct) === undefined && percentile === undefined) {
      return setError('Renseigne au moins la stanine, un score, un percentile ou un nombre de bonnes réponses.');
    }
    const correct = num(f.correct), wrong = num(f.wrong), minutes = num(f.minutes);
    const now = new Date();
    const date = new Date(`${f.date}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`);
    await db.results.add({
      date: date.toISOString(),
      source: free ? f.source : test!.source,
      exerciseId: free ? `${f.source}:${slugify(f.name)}` : test!.id,
      exerciseName: free ? f.name.trim() : test!.name,
      category: categoryOf(test),
      correct, wrong, total: correct !== undefined && wrong !== undefined ? correct + wrong : undefined,
      scorePct: score, durationS: minutes !== undefined ? Math.round(minutes * 60) : undefined,
      percentile, stanine: stanine ?? undefined,
      difficulty: f.difficulty.trim() || undefined, comment: f.comment.trim() || undefined,
    });
    onSaved();
  };

  return (
    <div className="card stack">
      <h2>Résultat de plateforme</h2>
      <label className="field">Test
        <select value={testId} onChange={(e) => { setTestId(e.target.value); setError(''); }}>
          <option value="">Choisir…</option>
          {STAGE_ORDER.map((st) => {
            const list = (tests ?? []).filter((t) => t.stage === st && t.active).sort((a, b) => a.name.localeCompare(b.name));
            return list.length ? (
              <optgroup key={st} label={STAGES[st]}>
                {list.map((t) => <option key={t.id} value={t.id}>{t.name}{t.source !== 'pilotest' ? ` (${SOURCES[t.source]})` : ''}</option>)}
              </optgroup>
            ) : null;
          })}
          <option value="__libre">Autre test (saisie libre)</option>
        </select>
      </label>
      {free && (
        <>
          <div className="seg">
            {(['pilotest', 'epltest'] as const).map((s) => (
              <button key={s} className={f.source === s ? 'on' : ''} onClick={() => setF({ ...f, source: s })}>{SOURCES[s]}</button>
            ))}
          </div>
          <label className="field">Nom du test<input value={f.name} onChange={set('name')} placeholder="Tel qu’affiché sur la plateforme" /></label>
        </>
      )}
      {test && (
        <p className="muted small">
          Objectif : stanine {test.target}.{' '}
          {previous?.length
            ? `Dernières saisies : ${previous.map((r) => `${r.stanine !== undefined ? `stanine ${r.stanine}` : r.scorePct !== undefined ? `${r.scorePct} %` : '—'} (${fmtDate(r.date)})`).join(' · ')}.`
            : 'Aucune saisie pour ce test.'}
        </p>
      )}
      <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
        Stanine obtenue
        <div className="days">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} className={stanine === n ? 'on' : ''} onClick={() => setStanine(stanine === n ? null : n)}>{n}</button>
          ))}
        </div>
      </div>
      <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => setMore(!more)}>
        {more ? 'Masquer les détails' : 'Ajouter des détails (score, temps, commentaire…)'}
      </button>
      {more && (
        <>
          <div className="grid2">
            <label className="field">Date<input type="date" value={f.date} max={today} onChange={set('date')} /></label>
            <label className="field">Score (%)<input inputMode="decimal" value={f.score} onChange={set('score')} /></label>
            <label className="field">Bonnes réponses<input inputMode="numeric" value={f.correct} onChange={set('correct')} /></label>
            <label className="field">Mauvaises réponses<input inputMode="numeric" value={f.wrong} onChange={set('wrong')} /></label>
            <label className="field">Temps (min)<input inputMode="decimal" value={f.minutes} onChange={set('minutes')} /></label>
            <label className="field">Percentile<input inputMode="decimal" value={f.percentile} onChange={set('percentile')} /></label>
          </div>
          <label className="field">Difficulté / réglages<input value={f.difficulty} onChange={set('difficulty')} placeholder="Ex. : mode examen" /></label>
          <label className="field">Commentaire<textarea rows={2} value={f.comment} onChange={set('comment')} /></label>
        </>
      )}
      {error && <p className="error">{error}</p>}
      <button className="btn block" onClick={() => void save()}>Enregistrer</button>
    </div>
  );
}

/** Tests de plateforme classés par priorité de travail. */
export function Priorites({ results, limit = 5 }: { results: Result[]; limit?: number }) {
  const tests = useCatalog();
  const ranked = rankExternal(tests ?? [], results.filter((r) => r.source !== 'app')).slice(0, limit);
  if (!ranked.length) return null;
  return (
    <div className="card">
      <h2>Tests de plateforme à travailler en priorité</h2>
      <p className="muted small" style={{ marginBottom: 6 }}>
        Priorité = écart à ton objectif de stanine, ancienneté de la dernière pratique, points faibles déclarés.
      </p>
      <div className="list">
        {ranked.map((p, i) => (
          <div className="item" key={p.test.id}>
            <span className="badge">{i + 1}</span>
            <span className="grow">
              <span className="title">{p.test.name}</span>
              <span className="muted" style={{ display: 'block' }}>{STAGES[p.test.stage]} · {p.reason}</span>
            </span>
            {p.stats.recent !== null && (
              <span className={`badge ${p.stats.recent >= p.test.target ? 'ok' : 'warn'}`}>{String(p.stats.recent).replace('.', ',')} / {p.test.target}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Catalogue : objectif de stanine, point faible, activation, ajout de tests. */
export function Catalogue({ results }: { results: Result[] }) {
  const tests = useCatalog();
  const [adding, setAdding] = useState({ name: '', source: 'pilotest' as Exclude<Source, 'app'>, stage: 'psy1' as Stage });
  const [error, setError] = useState('');
  const ranked = rankExternal((tests ?? []).map((t) => ({ ...t, active: true })), results.filter((r) => r.source !== 'app'));
  const statsOf = (id: string) => ranked.find((p) => p.test.id === id)?.stats;
  const patch = (t: ExtTest, p: Partial<ExtTest>) => void db.extTests.update(t.id, p);

  const add = async () => {
    const name = adding.name.trim();
    if (!name) return setError('Indique le nom du test.');
    const id = `${adding.source}:${slugify(name)}`;
    if (await db.extTests.get(id)) return setError('Ce test existe déjà dans le catalogue.');
    await db.extTests.add({ id, source: adding.source, name, stage: adding.stage, aptitudes: [], target: 6, weak: false, active: true, custom: true });
    setAdding({ ...adding, name: '' });
    setError('');
  };

  return (
    <>
      <div className="card">
        <p className="muted">
          Liste reprise des pages publiques de Pilotest (sélections Cadets Air France), relevée le {fmtDate(CATALOG_DATE)}. Le programme
          évolue d’une session à l’autre : désactive les tests retirés, ajoute les nouveaux. L’objectif de stanine est ton repère personnel,
          pas un seuil officiel.
        </p>
      </div>
      {STAGE_ORDER.map((st) => {
        const list = (tests ?? []).filter((t) => t.stage === st).sort((a, b) => a.name.localeCompare(b.name));
        if (!list.length) return null;
        return (
          <div className="card" key={st}>
            <h2>{STAGES[st]}</h2>
            <div className="list">
              {list.map((t) => {
                const s = statsOf(t.id);
                return (
                  <div className="item" key={t.id} style={{ display: 'block', opacity: t.active ? 1 : 0.5 }}>
                    <div className="row between">
                      <span className="grow">
                        <span className="title">{t.name}</span>
                        <span className="muted small" style={{ display: 'block' }}>
                          {SOURCES[t.source]}{t.aptitudes.length ? ` · ${t.aptitudes.join(', ')}` : ''}{t.minutes ? ` · ${t.minutes} min` : ''}
                        </span>
                        <span className="muted small" style={{ display: 'block' }}>
                          {s?.attempts ? `${s.attempts} saisie${s.attempts > 1 ? 's' : ''}${s.recent !== null ? ` · récente ${String(s.recent).replace('.', ',')} · meilleure ${s.best}` : ''}` : 'Aucune saisie'}
                        </span>
                      </span>
                      <span className="row" style={{ gap: 4 }}>
                        <button className="btn ghost sm" aria-label="Baisser l’objectif" onClick={() => patch(t, { target: Math.max(1, t.target - 1) })}>−</button>
                        <span className="badge" title="Objectif de stanine">Obj. {t.target}</span>
                        <button className="btn ghost sm" aria-label="Monter l’objectif" onClick={() => patch(t, { target: Math.min(9, t.target + 1) })}>+</button>
                      </span>
                    </div>
                    <div className="row" style={{ marginTop: 6 }}>
                      <button className={`btn sm ${t.weak ? '' : 'ghost'}`} onClick={() => patch(t, { weak: !t.weak })}>{t.weak ? '★ Point faible' : '☆ Point faible'}</button>
                      <button className="btn ghost sm" onClick={() => patch(t, { active: !t.active })}>{t.active ? 'Désactiver' : 'Réactiver'}</button>
                      {t.custom && !s?.attempts && <button className="btn danger sm" onClick={() => void db.extTests.delete(t.id)}>Supprimer</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="card stack">
        <h2>Ajouter un test</h2>
        <label className="field">Nom du test<input value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} /></label>
        <div className="grid2">
          <label className="field">Plateforme
            <select value={adding.source} onChange={(e) => setAdding({ ...adding, source: e.target.value as Exclude<Source, 'app'> })}>
              <option value="pilotest">Pilotest</option><option value="epltest">EPL Test</option>
            </select>
          </label>
          <label className="field">Étape
            <select value={adding.stage} onChange={(e) => setAdding({ ...adding, stage: e.target.value as Stage })}>
              <option value="psy1">PSY1</option><option value="psy0">PSY0</option><option value="autre">Autre</option>
            </select>
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn ghost" onClick={() => void add()}>Ajouter au catalogue</button>
      </div>
    </>
  );
}
