import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { CATEGORIES, type CategoryId, db } from '../db';
import { exerciseStats, levelOf } from '../domain/adaptive';
import { byCategory } from '../exercises/registry';
import { pct } from '../ui';

export default function Train() {
  const results = useLiveQuery(() => db.results.where('source').equals('app').toArray(), []);
  const levels = useLiveQuery(() => db.levels.toArray(), []);
  const sorted = [...(results ?? [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="app">
      <header className="top">
        <h1>Entraînement</h1>
        <p>Exercice libre : le niveau s’ajuste à vos résultats</p>
      </header>
      <main className="page">
        {(Object.keys(CATEGORIES) as CategoryId[]).filter((cat) => byCategory(cat).length > 0).map((cat) => (
          <div className="card" key={cat}>
            <h2>{CATEGORIES[cat]}</h2>
            <div className="list">
              {byCategory(cat).map((def) => {
                const st = exerciseStats(sorted.filter((r) => r.exerciseId === def.id));
                return (
                  <Link className="item" key={def.id} to={`/run/${def.id}`}>
                    <span className="grow">
                      <span className="title">{def.name}</span>
                      <span className="muted" style={{ display: 'block' }}>
                        {st.sessions === 0 ? 'Jamais travaillé' : `${st.sessions} séance${st.sessions > 1 ? 's' : ''} · précision récente ${pct(st.recentAcc ?? 0)}`}
                      </span>
                    </span>
                    {!def.noLevel && <span className="badge">Niv. {levelOf(levels, def.id)}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
