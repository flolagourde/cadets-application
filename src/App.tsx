import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { BiaHome, BiaPartView } from './pages/Bia';
import { DailyHome, DailyView } from './pages/Daily';
import Home from './pages/Home';
import { FicheView, Library } from './pages/Library';
import Progress from './pages/Progress';
import Run from './pages/Run';
import Settings from './pages/Settings';
import Train from './pages/Train';

const ICONS: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  train: 'M12 3v4M12 17v4M3 12h4M17 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  progress: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  bia: 'M3 9l9-5 9 5-9 5-9-5ZM7 12v4c2.5 2 7.5 2 10 0v-4M21 9v6',
  library: 'M5 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5zM19 4h-6v14h6z',
  settings: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4',
};

function Tab({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={ICONS[icon]} />
      </svg>
      {label}
    </NavLink>
  );
}

function Shell() {
  const { pathname } = useLocation();
  const inRun = pathname.startsWith('/run/');
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/train" element={<Train />} />
        <Route path="/run/:id" element={<Run />} />
        <Route path="/bia" element={<BiaHome />} />
        <Route path="/bia/:id" element={<BiaPartView />} />
        <Route path="/daily" element={<DailyHome />} />
        <Route path="/daily/:id" element={<DailyView />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/:id" element={<FicheView />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      {!inRun && (
        <div className="tabbar">
          <nav>
            <Tab to="/" icon="home" label="Accueil" />
            <Tab to="/train" icon="train" label="Entraînement" />
            <Tab to="/bia" icon="bia" label="BIA" />
            <Tab to="/library" icon="library" label="Bibliothèque" />
            <Tab to="/progress" icon="progress" label="Progression" />
            <Tab to="/settings" icon="settings" label="Réglages" />
          </nav>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
