import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DAILY, DAILY_BATCH, DAILY_THEMES, type DailyFact } from '../content/daily';
import { dailyState, dailyStreak, dueDailyQids, loadDailyLog, loadDailySrs, MAX_REVIEWS_IN_DAILY } from '../domain/daily';
import { fmtDate } from '../ui';

function useDaily() {
  return useLiveQuery(async () => {
    const [log, srs] = await Promise.all([loadDailyLog(), loadDailySrs()]);
    return { log, srs };
  }, []);
}

function FactCard({ fact }: { fact: DailyFact }) {
  return (
    <>
      <div className="card fiche">
        <ul>{fact.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
      </div>
      <div className="card">
        <p style={{ margin: 0 }}><b>À retenir : </b>{fact.retenir}</p>
      </div>
      <p className="muted small" style={{ margin: '0 4px' }}>
        {fact.volatile ? `Données susceptibles de changer, vérifiées le ${fmtDate(fact.asOf)}.` : `Rédigé le ${fmtDate(fact.asOf)}.`}
        {fact.sources?.length ? ` Sources : ${fact.sources.map((s) => s.title).join(' ; ')}.` : ' Connaissance de référence, sans donnée susceptible de changer.'}
      </p>
    </>
  );
}

/** Page du jour : le fait à lire, ses questions, puis l'archive des faits déjà vus. */
export function DailyHome() {
  const data = useDaily();
  if (!data) return null;
  const st = dailyState(data.log);
  const due = st.fact ? dueDailyQids(data.srs, data.log, new Date(), st.fact.id).length : dueDailyQids(data.srs, data.log).length;
  const streak = dailyStreak(data.log);
  const seen = DAILY.filter((f) => data.log[f.id]).sort((a, b) => data.log[b.id].localeCompare(data.log[a.id]));

  return (
    <div className="app">
      <header className="top">
        <h1>Le fait du jour</h1>
        <p>{DAILY_BATCH.title} · {st.doneCount}/{st.total} faits vus{streak > 1 ? ` · ${streak} jours de suite` : ''}</p>
      </header>
      <main className="page">
        {st.fact ? (
          <>
            <div className="card stack">
              <div className="row between">
                <span className="badge">{DAILY_THEMES[st.fact.theme]}</span>
                <span className="muted small">Jour {st.rank}/{st.total}</span>
              </div>
              <h2 style={{ margin: 0 }}>{st.fact.title}</h2>
            </div>
            <FactCard fact={st.fact} />
            {st.doneToday ? (
              <div className="card stack">
                <p className="badge ok" style={{ alignSelf: 'flex-start' }}>Fait du jour terminé</p>
                <p className="muted" style={{ margin: 0 }}>Le prochain fait arrive demain.{due ? ` Il te reste ${due} rappel${due > 1 ? 's' : ''} aujourd’hui.` : ''}</p>
                {due > 0 && <Link className="btn ghost" to="/run/daily:review">Faire les rappels</Link>}
              </div>
            ) : (
              <Link className="btn block" to={`/run/daily:${st.fact.id}`}>
                Aux questions : 2{due ? ` + ${Math.min(due, MAX_REVIEWS_IN_DAILY)} rappel${Math.min(due, MAX_REVIEWS_IN_DAILY) > 1 ? 's' : ''}` : ''}
              </Link>
            )}
          </>
        ) : (
          <div className="card stack">
            <h2 style={{ margin: 0 }}>Lot terminé</h2>
            <p>Tu as vu les {st.total} faits de ce lot. Demande le lot suivant pour continuer.</p>
            {due > 0 && <Link className="btn" to="/run/daily:review">Faire les rappels ({due})</Link>}
          </div>
        )}

        {seen.length > 0 && (
          <div className="card">
            <h2>Déjà vus</h2>
            <div className="list">
              {seen.map((f) => (
                <Link className="item" key={f.id} to={`/daily/${f.id}`}>
                  <span className="grow">
                    <span className="title">{f.title}</span>
                    <span className="muted" style={{ display: 'block' }}>{DAILY_THEMES[f.theme]} · {fmtDate(data.log[f.id])}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/** Relire un fait déjà vu (les faits à venir restent cachés). */
export function DailyView() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const data = useDaily();
  if (!data) return null;
  const fact = DAILY.find((f) => f.id === id);
  if (!fact || !data.log[fact.id]) return <div className="page"><p>Ce fait n’est pas encore débloqué.</p><Link className="btn" to="/daily">Retour</Link></div>;
  return (
    <div className="app">
      <header className="top">
        <button onClick={() => nav('/daily')} style={{ background: 'none', border: 0, color: '#b9c6dc', padding: 0, fontSize: 14 }}>‹ Le fait du jour</button>
        <h1 style={{ marginTop: 4 }}>{fact.title}</h1>
        <p>{DAILY_THEMES[fact.theme]} · vu le {fmtDate(data.log[fact.id])}</p>
      </header>
      <main className="page">
        <FactCard fact={fact} />
        <Link className="btn ghost block" to={`/run/daily:${fact.id}`}>Refaire les questions</Link>
      </main>
    </div>
  );
}
