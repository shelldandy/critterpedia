import { useEffect } from 'react';

import { useMessages } from '../i18n/useMessages.ts';
import { useSettings } from '../store/useSettings.ts';
import { SCHEMES, watchSystemScheme, type Scheme } from '../theme/scheme.ts';

const ICON: Record<string, string> = {
  light: '☀',
  dark: '☾',
  system: '◐',
};

/**
 * Light / dark / system switch, styled to match the hemisphere control next to it.
 * Icons carry a text label too — a sun/moon glyph alone is ambiguous at this size.
 */
export const SchemePicker = () => {
  const scheme = useSettings((s) => s.scheme);
  const setScheme = useSettings((s) => s.setScheme);
  const { t } = useMessages();

  const names: Record<Scheme, string> = {
    light: t.schemeLight,
    dark: t.schemeDark,
    system: t.schemeSystem,
  };

  /*
    In 'system' mode the OS can flip while the app is open. `applyScheme` mutates the DOM
    directly, so nothing would re-render on its own — the forced `setScheme` keeps React's
    view (which button reads as pressed) consistent with what is painted.
  */
  useEffect(() => watchSystemScheme(scheme, () => setScheme('system')), [scheme, setScheme]);

  return (
    <div
      role="group"
      aria-label={t.colorScheme}
      className="flex overflow-hidden rounded-lg border border-slate-300 text-xs dark:border-slate-600"
    >
      {SCHEMES.map((s) => (
        <button
          key={s.id}
          type="button"
          aria-pressed={scheme === s.id}
          onClick={() => setScheme(s.id)}
          className={`px-2 py-1.5 font-medium ${
            scheme === s.id
              ? 'bg-accent-600 text-white'
              : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <span aria-hidden className="mr-1">
            {ICON[s.id]}
          </span>
          {names[s.id]}
        </button>
      ))}
    </div>
  );
};
