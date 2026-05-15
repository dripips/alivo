import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './i18n/index';
import App from './App';
import { useA11yStore } from './store/accessibility.store';
import { useAuthStore } from './store/auth.store';

/* ---- Dark mode detection ---- */
function applyTheme() {
  const stored = localStorage.getItem('alivo_theme');
  const prefersDark =
    stored === 'dark' ||
    (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.classList.toggle('dark', prefersDark);
}

applyTheme();

useA11yStore.getState().hydrate();
useAuthStore.getState().hydrate();

/* Listen for OS-level changes when no explicit preference is stored */
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    if (!localStorage.getItem('alivo_theme')) {
      applyTheme();
    }
  });

/* ---- Mount ---- */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
