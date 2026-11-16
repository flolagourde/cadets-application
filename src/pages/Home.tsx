import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dayKey, db, DEFAULT_SETTINGS, type Settings, SOURCES } from '../db';
import { DEFAULT_TEST_MINUTES, streak } from '../domain/adaptive';
import { type DayPlan, doneToday, getOrCreatePlan, nextInPlan } from '../domain/plan';
import { EXERCISES } from '../exercises/registry';
import { fmtMin } from '../ui';

const FORMATS = [10, 20, 45];

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - new Date(dayKey()).getTime()) / 86400000);
}

export default function Home() {
  const results = useLiveQuery(() => db.results.toArray(), []);
  const settings = useLiveQuery(async () => ({ ...DEFAULT_SETTINGS, ...(((await db.kv.get('settings'))?.value as Partial<Settings>) ?? {}) }), []);
  const tests = useLiveQuery(() => db.extTests.toArray(), []);
  const [plan, setPlan] = useState<DayPlan | null>(null);

  useEffect(() => { void getOrCreatePlan().then(setPlan); }, []);

  const all = results ?? [];
  const done = doneToday(all);
  const nextId = nextInPlan(plan ?? undefined, done);
  const weekAgo = Date.now() - 7 * 86400000;
  const week = all.filter((r) => new Date(r.date).getTime() >= weekAgo);
  const weekSeconds = week.reduce((s, r) => s + (r.durationS ?? 0), 0);
  const weekDays = new Set(week.map((r) => dayKey(r.date))).size;
  const cadets = daysUntil(settings?.cadetsDate);
  const bia = daysUntil(settings?.biaDate);
  const backupAge = settings?.lastBackupAt ? Math.floor((Date.now() - new Date(settings.lastBackupAt).getTime()) / 86400000) : null;
  const isRest = settings?.restDays.includes(new Date().getDay());

  return (
    <div className="app">
      <header className="top">
        <h1>Cap Cadets</h1>
        <p>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </header>
      <main className="page">
        <div className="grid2">
          <Link to="/settings" className="kpi" style={{ textDecoration: 'none', color: 'inherit' }}>
            <b>{cadets === null ? '—' : cadets >= 0 ? `J-${cadets}` : 'Passé'}</b>
            <span>{cadets === null ? 'Date des sélections à définir' : 'Sélections Cadets'}</span>
          </Link>
          <Link to="/settings" className="kpi" style={{ textDecoration: 'none', color: 'inherit' }}>
            <b>{bia === null ? '—' : bia >= 0 ? `J-${bia}` : 'Passé'}</b>
            <span>{bia === null ? 'Date du BIA à définir' : 'Examen BIA'}</span>
          </Link>
        </div>

        <div className="card stack">
          <div className="row between">
            <h2 style={{ margin: 0 }}>Séance du jour</h2>
            {plan && <span className="badge">{plan.items.filter((i) => done.has(i.exerciseId)).length}/{plan.items.length}</span>}
          </div>
          {isRest && <p className="muted">Jour de repos prévu dans vos réglages : la séance reste disponible si vous le souhaitez.</p>}
          <div className="seg">
            {FORMATS.map((m) => (
              <button key={m} className={plan?.minutes === m ? 'on' : ''} onClick={() => void getOrCreatePlan(m).then(setPlan)}>
                {m} min
              </button>
            ))}
          </div>
          <div className="list">
            {plan?.items.map((it) => {
              const def = EXERCISES[it.exerciseId];
              if (!def) return null;
              return (
                <Link className="item" key={it.exerciseId} to={`/run/${it.exerciseId}`}>
                  <span className={`check ${done.has(it.exerciseId) ? 'done' : ''}`}>{done.has(it.exerciseId) ? '✓' : ''}</span>
                  <span className="grow">
                    <span className="title">{def.name}</span>
                    <span className="muted" style={{ display: 'block' }}>{it.reason}</span>
                  </span>
                  <span className="muted small">{def.estMinutes} min</span>
                </Link>
              );
            })}
          </div>
          {nextId ? (
            <Link className="btn block" to={`/run/${nextId}`}>{plan?.items.some((i) => done.has(i.exerciseId)) ? 'Continuer la séance' : 'Démarrer la séance'}</Link>
          ) : plan ? (
            <p className="badge ok" style={{ alignSelf: 'flex-start' }}>Séance du jour terminée</p>
          ) : null}
        </div>

        {plan?.external && plan.external.length > 0 && (
          <div className="card stack">
            <div className="row between">
              <h2 style={{ margin: 0 }}>Sur plateforme (ordinateur)</h2>
              <span className="badge">{plan.external.filter((e) => done.has(e.testId)).length}/{plan.external.length}</span>
            </div>
            <p className="muted">Tests choisis d’après tes stanines saisies. Touche un test pour enregistrer ton résultat.</p>
            <div className="list">
              {plan.external.map((e) => {
                const t = tests?.find((x) => x.id === e.testId);
                if (!t) return null;
                return (
                  <Link className="item" key={e.testId} to={`/progress?test=${encodeURIComponent(e.testId)}`}>
                    <span className={`check ${done.has(e.testId) ? 'done' : ''}`}>{done.has(e.testId) ? '✓' : ''}</span>
                    <span className="grow">
                      <span className="title">{t.name}</span>
                      <span className="muted" style={{ display: 'block' }}>{SOURCES[t.source]} · {e.reason}</span>
                    </span>
                    <span className="muted small">{t.minutes ?? `~${DEFAULT_TEST_MINUTES}`} min</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {plan && (
          <button className="btn ghost sm" style={{ alignSelf: 'center' }} onClick={() => void getOrCreatePlan(plan.minutes, true).then(setPlan)}>
            Recalculer le plan du jour
          </button>
        )}

        <div className="grid3">
          <div className="kpi"><b>{streak(all)}</b><span>jours d’affilée</span></div>
          <div className="kpi"><b>{weekDays}/7</b><span>jours actifs (7 j)</span></div>
          <div className="kpi"><b>{fmtMin(weekSeconds)}</b><span>cette semaine</span></div>
        </div>

        {all.length > 0 && (backupAge === null || backupAge >= 7) && (
          <Link to="/settings" className="notice" style={{ textDecoration: 'none' }}>
            {backupAge === null ? 'Aucune sauvegarde effectuée.' : `Dernière sauvegarde il y a ${backupAge} jours.`} Vos données ne
            vivent que sur cet appareil : exportez-les depuis Réglages.
          </Link>
        )}
      </main>
    </div>
  );
}
