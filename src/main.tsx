import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles.css';

registerSW({ immediate: true });
// Demande au navigateur de ne pas purger les données locales (accordé d'office à une PWA installée sur iOS).
void navigator.storage?.persist?.();

createRoot(document.getElementById('root')!).render(<App />);
