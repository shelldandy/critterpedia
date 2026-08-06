import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { applyLang } from './i18n/lang.ts';
import { useSettings } from './store/useSettings.ts';
import { applyScheme } from './theme/scheme.ts';
import { applyTheme } from './theme/themes.ts';
import './index.css';

// Rehydration only fires when something was stored, so a first visit would otherwise keep
// the stale <meta name="theme-color"> from index.html. Applying the current value covers both.
// `data-scheme` likewise must exist before first paint or every `dark:` class is inert.
// `lang` follows the same rule so `<html lang>` never contradicts the names being shown.
applyTheme(useSettings.getState().theme);
applyScheme(useSettings.getState().scheme);
applyLang(useSettings.getState().lang);

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
