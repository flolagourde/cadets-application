import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, type CategoryId, db, DEFAULT_SETTINGS, saveSettings, type Settings as S } from '../db';
import { EXERCISE_LIST } from '../exercises/registry';
import { deliverFile, exportData, importData } from '../domain/backup';
import { fmtDate } from '../ui';

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export default function Settings() {
  const settings = useLiveQuery(async () => ({ ...DEFAULT_SETTINGS, ...(((await db.kv.get('settings'))?.value as Partial<S>) ?? {}) }), []);
  const count = useLiveQuery(() => db.results.count(), []);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [wipe, setWipe] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { void navigator.storage?.persisted?.().then(setPersisted); }, []);

  if (!settings) return null;
  const s = settings;
  const info = (m: string) => { setMsg(m); setErr(''); };
  const fail = (e: unknown) => { setErr((e as Error).message); setMsg(''); };

  const doExport = async () => {
    try {
      const content = await exportData(password || undefined);
      await deliverFile(content, `cap-cadets-${new Date().toLocaleDateString('sv')}${password ? '-chiffre' : ''}.json`);
      info(password ? 'Sauvegarde chiffrée générée. Sans le mot de passe, elle est irrécupérable.' : 'Sauvegarde générée (non chiffrée).');
    } catch (e) { fail(e); }
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const n = await importData(await file.text(), password || undefined);
      info(`Sauvegarde restaurée : ${n} résultat${n > 1 ? 's' : ''}.`);
    } catch (e) { fail(e); }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="app">
      <header className="top">
        <h1>Réglages</h1>
        <p>Tout est modifiable à tout moment</p>
      </header>
      <main className="page">
        <div className="card stack">
          <h2>Échéances</h2>
          <div className="grid2">
            <label className="field">Sélections Cadets (estimée)
              <input type="date" value={s.cadetsDate ?? ''} onChange={(e) => void saveSettings({ cadetsDate: e.target.value || undefined })} />
            </label>
            <label className="field">Examen BIA
              <input type="date" value={s.biaDate ?? ''} onChange={(e) => void saveSettings({ biaDate: e.target.value || undefined })} />
            </label>
          </div>
          <label className="field">Début de la préparation
            <input type="date" value={s.startDate ?? ''} onChange={(e) => void saveSettings({ startDate: e.target.value || undefined })} />
          </label>
        </div>

        <div className="card stack">
          <h2>Rythme</h2>
          <label className="field">Durée par défaut de la séance du jour
            <select value={s.minutesPerDay} onChange={(e) => void saveSettings({ minutesPerDay: Number(e.target.value) })}>
              <option value={10}>Courte : 10 min</option>
              <option value={20}>Normale : 20 min</option>
              <option value={45}>Approfondie : 45 min</option>
            </select>
          </label>
          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
            Jours de repos
            <div className="days">
              {DAYS.map((d, i) => (
                <button key={i} className={s.restDays.includes(i) ? 'on' : ''}
                  onClick={() => void saveSettings({ restDays: s.restDays.includes(i) ? s.restDays.filter((x) => x !== i) : [...s.restDays, i] })}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card stack">
          <h2>Travail sur plateforme</h2>
          <p className="muted">Le plan du jour ajoute des tests Pilotest / EPL Test les jours où tu as un ordinateur, choisis selon tes stanines.</p>
          <label className="field">Temps de plateforme par jour
            <select value={s.externalMinutes} onChange={(e) => void saveSettings({ externalMinutes: Number(e.target.value) })}>
              <option value={0}>Ne rien prescrire</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </label>
          <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
            Jours avec ordinateur
            <div className="days">
              {DAYS.map((d, i) => (
                <button key={i} className={s.computerDays.includes(i) ? 'on' : ''}
                  onClick={() => void saveSettings({ computerDays: s.computerDays.includes(i) ? s.computerDays.filter((x) => x !== i) : [...s.computerDays, i] })}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card stack">
          <h2>Domaines à renforcer</h2>
          <p className="muted">Les domaines cochés passent plus souvent dans la séance du jour sur téléphone (priorité × 1,3).</p>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {(Object.keys(CATEGORIES) as CategoryId[]).filter((c) => EXERCISE_LIST.some((e) => e.category === c)).map((c) => (
              <button key={c} className={`btn sm ${s.focusCategories.includes(c) ? '' : 'ghost'}`}
                onClick={() => void saveSettings({ focusCategories: s.focusCategories.includes(c) ? s.focusCategories.filter((x) => x !== c) : [...s.focusCategories, c] })}>
                {CATEGORIES[c]}
              </button>
            ))}
          </div>
          <p className="muted small">Les changements s’appliquent au prochain plan, ou tout de suite avec « Recalculer le plan du jour » sur l’accueil.</p>
        </div>

        <div className="card stack">
          <h2>Sauvegarde</h2>
          <p className="muted">
            {count ?? 0} résultat{(count ?? 0) > 1 ? 's' : ''} sur cet appareil.{' '}
            {s.lastBackupAt ? `Dernière sauvegarde le ${fmtDate(s.lastBackupAt)}.` : 'Aucune sauvegarde effectuée.'}
          </p>
          <label className="field">Mot de passe (facultatif : chiffre l’export, requis pour restaurer un fichier chiffré)
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
          </label>
          <div className="grid2">
            <button className="btn" onClick={() => void doExport()}>Exporter</button>
            <button className="btn ghost" onClick={() => fileRef.current?.click()}>Restaurer…</button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void doImport(e.target.files?.[0])} />
          <p className="muted small">Restaurer remplace toutes les données actuelles par celles du fichier.</p>
          {msg && <p className="badge ok" style={{ alignSelf: 'flex-start', whiteSpace: 'normal' }}>{msg}</p>}
          {err && <p className="error">{err}</p>}
        </div>

        <div className="card stack">
          <h2>Stockage</h2>
          <p className="muted">
            Stockage persistant : {persisted === null ? 'non déterminé' : persisted ? 'accordé' : 'non accordé'}. Sur iPhone, installez l’app sur
            l’écran d’accueil (Safari → Partager → « Sur l’écran d’accueil ») : les données d’un site simplement ouvert dans Safari peuvent être
            effacées par iOS après une période sans visite.
          </p>
          <button className="btn danger" onClick={async () => {
            if (wipe < 2) return setWipe(wipe + 1);
            await Promise.all([db.results.clear(), db.levels.clear(), db.kv.clear(), db.extTests.clear()]);
            setWipe(0); info('Toutes les données ont été effacées.');
          }}>
            {wipe === 0 ? 'Effacer toutes les données' : wipe === 1 ? 'Vraiment tout effacer ? Touchez encore' : 'Dernière confirmation : effacer définitivement'}
          </button>
        </div>
        <p className="muted small" style={{ textAlign: 'center' }}>Cap Cadets 0.2 · aucune donnée ne quitte cet appareil</p>
      </main>
    </div>
  );
}
