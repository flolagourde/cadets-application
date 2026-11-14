import type { Figure } from './exercises/types';

export function Keypad({ onKey, onDel, onOk, okDisabled }: { onKey: (d: string) => void; onDel: () => void; onOk: () => void; okDisabled?: boolean }) {
  return (
    <div className="keys">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <button key={d} onClick={() => onKey(d)}>{d}</button>
      ))}
      <button onClick={onDel} aria-label="Effacer">⌫</button>
      <button onClick={() => onKey('0')}>0</button>
      <button className="okkey" onClick={onOk} disabled={okDisabled}>Valider</button>
    </div>
  );
}

export function FigureView({ figure, size = 120 }: { figure: Figure; size?: number }) {
  const n = figure.length;
  const cell = size / n;
  return (
    <svg className="fig" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="figure">
      {figure.flatMap((row, r) =>
        row.map((on, c) => (
          <rect key={`${r}-${c}`} className={on ? 'on' : 'off'} x={c * cell + 1} y={r * cell + 1} width={cell - 2} height={cell - 2} rx={3} />
        )),
      )}
    </svg>
  );
}

/**
 * Courbe d'évolution d'une série de valeurs entre 0 et 1 (ordre chronologique).
 * `guide` trace un repère horizontal (ex. seuil de 85 %).
 */
export function Sparkline({ values, guide, width = 120, height = 36 }: { values: number[]; guide?: number; width?: number; height?: number }) {
  if (values.length < 2) return <span className="muted small">— pas assez de données</span>;
  const pad = 4;
  const x = (i: number) => pad + (i * (width - 2 * pad)) / (values.length - 1);
  const y = (v: number) => height - pad - Math.max(0, Math.min(1, v)) * (height - 2 * pad);
  const last = values[values.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img"
      aria-label={`Évolution sur ${values.length} séances, dernière valeur ${Math.round(last * 100)} %`}>
      {guide !== undefined && <line x1={pad} x2={width - pad} y1={y(guide)} y2={y(guide)} stroke="#b9c2d0" strokeDasharray="3 3" strokeWidth={1} />}
      <polyline fill="none" stroke="#2f6fd6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
        points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
      <circle cx={x(values.length - 1)} cy={y(last)} r={3} fill="#2f6fd6" />
    </svg>
  );
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtSec = (ms: number) => `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
export const fmtMin = (s: number) => (s < 3600 ? `${Math.round(s / 60)} min` : `${Math.floor(s / 3600)} h ${String(Math.round((s % 3600) / 60)).padStart(2, '0')}`);
export const pct = (v: number) => `${Math.round(v * 100)} %`;
