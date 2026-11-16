import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PASSAGES, VOCAB } from '../content/english';
import { FICHES } from '../content/fiches';
import type { QStats } from '../content/quiz';
import { type Theme, THEMES } from '../content/types';
import { db } from '../db';
import { fmtDate } from '../ui';

/** Au-delà de ce délai, une fiche est signalée comme à revérifier. */
const STALE_DAYS = 180;
const ageDays = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

function useRead() {
  return useLiveQuery(async () => ((await db.kv.get('ficheRead'))?.value as Record<string, string> | undefined) ?? {}, []);
}
function useQStats() {
  return useLiveQuery(async () => ((await db.kv.get('qstats'))?.value as QStats | undefined) ?? {}, []);
}

/** Part des questions de la fiche réussies au moins une fois sur deux. */
function mastery(ids: string[], stats: QStats | undefined): string {
  const seen = ids.filter((id) => stats?.[id]?.[0]);
  if (!seen.length) return 'Quiz jamais fait';
  const good = seen.filter((id) => stats![id][1] / stats![id][0] >= 0.5).length;
  return `${good}/${ids.length} questions acquises`;
}

export function Library() {
  const read = useRead();
  const stats = useQStats();
  return (
    <div className="app">
      <header className="top">
        <h1>Bibliothèque</h1>
        <p>Fiches datées et sourcées, avec leur quiz</p>
      </header>
      <main className="page">
        {(Object.keys(THEMES) as Theme[]).map((theme) => (
          <div className="card" key={theme}>
            <div className="row between">
              <h2 style={{ margin: 0 }}>{THEMES[theme]}</h2>
              <Link className="btn ghost sm" to={`/run/quiz-${theme}`}>Quiz du thème</Link>
            </div>
            <div className="list">
              {FICHES.filter((f) => f.theme === theme).map((f) => (
                <Link className="item" key={f.id} to={`/library/${f.id}`}>
                  <span className={`check ${read?.[f.id] ? 'done' : ''}`}>{read?.[f.id] ? '✓' : ''}</span>
                  <span className="grow">
                    <span className="title">{f.title}</span>
                    <span className="muted" style={{ display: 'block' }}>
                      Vérifiée le {fmtDate(f.asOf)} · {mastery(f.questions.map((q) => q.id), stats)}
                    </span>
                  </span>
                  {ageDays(f.asOf) > STALE_DAYS && <span className="badge warn">À revérifier</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div className="card">
          <h2>Anglais</h2>
          <div className="list">
            <Link className="item" to="/run/en-vocab">
              <span className="grow">
                <span className="title">Vocabulaire aéronautique</span>
                <span className="muted" style={{ display: 'block' }}>{VOCAB.length} termes tirés du livret BIA</span>
              </span>
            </Link>
            <Link className="item" to="/run/en-reading">
              <span className="grow">
                <span className="title">Compréhension écrite</span>
                <span className="muted" style={{ display: 'block' }}>{PASSAGES.length} textes, 45 secondes par question</span>
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export function FicheView() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const read = useRead();
  const fiche = FICHES.find((f) => f.id === id);
  if (!fiche) return <div className="page"><p>Fiche introuvable.</p><Link className="btn" to="/library">Retour</Link></div>;
  const stale = ageDays(fiche.asOf) > STALE_DAYS;

  const toggleRead = async () => {
    const all = { ...(read ?? {}) };
    if (all[fiche.id]) delete all[fiche.id];
    else all[fiche.id] = new Date().toISOString();
    await db.kv.put({ key: 'ficheRead', value: all });
  };

  return (
    <div className="app">
      <header className="top">
        <button onClick={() => nav('/library')} style={{ background: 'none', border: 0, color: '#b9c6dc', padding: 0, fontSize: 14 }}>‹ Bibliothèque</button>
        <h1 style={{ marginTop: 4 }}>{fiche.title}</h1>
        <p>{THEMES[fiche.theme]} · données vérifiées le {fmtDate(fiche.asOf)}</p>
      </header>
      <main className="page">
        {stale && (
          <p className="notice">Cette fiche a plus de six mois : ses données (dirigeants, flotte, réseau) ont pu changer. Demande une mise à jour avant de t’y fier.</p>
        )}
        <div className="card fiche">
          {fiche.intro && <p className="muted">{fiche.intro}</p>}
          {fiche.sections.map((s) => (
            <div key={s.title}>
              <h3>{s.title}</h3>
              <ul>{s.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          ))}
        </div>
        {fiche.caveats && fiche.caveats.length > 0 && (
          <div className="card fiche">
            <h2>Points à surveiller</h2>
            <ul>{fiche.caveats.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
        )}
        <div className="grid2">
          <Link className="btn" to={`/run/fiche:${fiche.id}`}>Quiz ({fiche.questions.length} questions)</Link>
          <button className="btn ghost" onClick={() => void toggleRead()}>{read?.[fiche.id] ? '✓ Fiche lue' : 'Marquer comme lue'}</button>
        </div>
        <div className="card fiche">
          <h2>Sources</h2>
          <ul>
            {fiche.sources.map((s, i) => (
              <li key={i} className="small">{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}</li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
