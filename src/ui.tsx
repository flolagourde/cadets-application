import type { Cell, DialSpec, Figure } from './exercises/types';

export function Keypad({ onKey, onDel, onOk, onSign, okDisabled }: { onKey: (d: string) => void; onDel: () => void; onOk: () => void; onSign?: () => void; okDisabled?: boolean }) {
  return (
    <div className="keys">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <button key={d} onClick={() => onKey(d)}>{d}</button>
      ))}
      {onSign ? <button onClick={onSign} aria-label="Changer de signe">±</button> : <span />}
      <button onClick={() => onKey('0')}>0</button>
      <button onClick={onDel} aria-label="Effacer">⌫</button>
      <button className="okkey" style={{ gridColumn: '1 / -1' }} onClick={onOk} disabled={okDisabled}>Valider</button>
    </div>
  );
}

/** Cadran gradué de 0 à 9. Les chiffres tournent dans le sens horaire, ou antihoraire si `ccw`. */
export function Dial({ dial, size = 84 }: { dial: DialSpec; size?: number }) {
  const c = size / 2, r = c - 3, dir = dial.ccw ? -1 : 1;
  const at = (v: number, radius: number): [number, number] => {
    const a = (dir * v * 36 - 90) * (Math.PI / 180);
    return [c + radius * Math.cos(a), c + radius * Math.sin(a)];
  };
  const [nx, ny] = at(dial.pos, r * 0.62);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="cadran">
      <circle cx={c} cy={c} r={r} fill="#fff" stroke="#14345f" strokeWidth={2} />
      {Array.from({ length: 10 }, (_, d) => {
        const [x1, y1] = at(d, r); const [x2, y2] = at(d, r * 0.88); const [tx, ty] = at(d, r * 0.72);
        return (
          <g key={d}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#14345f" strokeWidth={1.5} />
            <text x={tx} y={ty} fontSize={size * 0.14} textAnchor="middle" dominantBaseline="central" fill="#12213a" fontWeight={600}>{d}</text>
          </g>
        );
      })}
      <line x1={c} y1={c} x2={nx} y2={ny} stroke="#c93a3a" strokeWidth={3} strokeLinecap="round" />
      <circle cx={c} cy={c} r={3.5} fill="#c93a3a" />
    </svg>
  );
}

/** Case de matrice : `count + 1` formes identiques, de taille et de remplissage donnés. */
export function MatrixCell({ cell, size = 64 }: { cell: Cell | null; size?: number }) {
  if (!cell) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="case à trouver">
        <rect x={1} y={1} width={62} height={62} rx={8} fill="#e8eef9" stroke="#2f6fd6" strokeDasharray="4 3" />
        <text x={32} y={33} fontSize={26} textAnchor="middle" dominantBaseline="central" fill="#2f6fd6" fontWeight={700}>?</text>
      </svg>
    );
  }
  const n = cell.count + 1;
  const h = [5, 7.5, 10][cell.size];
  const fill = ['none', '#9db8e6', '#14345f'][cell.fill];
  const xs = n === 1 ? [32] : n === 2 ? [20, 44] : [11, 32, 53];
  const shape = (x: number, i: number) => {
    const common = { fill, stroke: '#14345f', strokeWidth: 2 };
    if (cell.shape === 0) return <circle key={i} cx={x} cy={32} r={h} {...common} />;
    if (cell.shape === 1) return <rect key={i} x={x - h} y={32 - h} width={2 * h} height={2 * h} {...common} />;
    return <polygon key={i} points={`${x},${32 - h} ${x + h},${32 + h} ${x - h},${32 + h}`} {...common} />;
  };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="case">
      <rect x={1} y={1} width={62} height={62} rx={8} fill="#fff" stroke="#dfe4ec" />
      {xs.map(shape)}
    </svg>
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
