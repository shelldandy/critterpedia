/**
 * Light / dark scheme.
 *
 * Three states, not two: 'system' must stay a real, sticky choice so the app keeps
 * following the OS for anyone who never opens the picker. A plain boolean toggle would
 * silently freeze that on first click.
 *
 * The resolved value is written to `data-scheme` on <html>, which is what the `dark:`
 * variant keys off — see the `@custom-variant` in `src/index.css`.
 */

export const SCHEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
] as const;

export type Scheme = (typeof SCHEMES)[number]['id'];
/** What actually gets painted — 'system' always collapses to one of these. */
export type ResolvedScheme = 'light' | 'dark';

export const DEFAULT_SCHEME: Scheme = 'system';

export const isScheme = (v: unknown): v is Scheme =>
  typeof v === 'string' && SCHEMES.some((s) => s.id === v);

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Guarded for non-browser callers (tests, SSR) — `matchMedia` is not universal. */
const prefersDark = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(DARK_QUERY).matches;

export const resolveScheme = (scheme: Scheme): ResolvedScheme =>
  scheme === 'system' ? (prefersDark() ? 'dark' : 'light') : scheme;

export const applyScheme = (scheme: Scheme): ResolvedScheme => {
  const resolved = resolveScheme(scheme);
  document.documentElement.dataset.scheme = resolved;
  return resolved;
};

/**
 * Keeps the DOM in sync while the OS flips (sunset, manual toggle) during a session.
 * Only meaningful in 'system' mode; for an explicit choice this is a no-op teardown, so
 * callers can wire it unconditionally. Returns an unsubscribe.
 */
export const watchSystemScheme = (scheme: Scheme, onChange: () => void): (() => void) => {
  if (scheme !== 'system') return () => {};
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};

  const mq = window.matchMedia(DARK_QUERY);
  const handler = () => {
    applyScheme('system');
    onChange();
  };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
};
