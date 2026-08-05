/**
 * Accent themes.
 *
 * Each theme supplies the four accent ramp stops the UI actually uses. They are applied
 * by writing CSS custom properties onto `<html>`, NOT by swapping Tailwind classes —
 * Tailwind 4 resolves `bg-accent-600` at build time, so the class must stay constant and
 * only the variable behind it may change. See `src/index.css`.
 */

export const THEMES = [
  {
    id: 'leaf',
    label: 'Leaf',
    // Shown in the picker swatch and written to <meta name="theme-color">.
    swatch: '#16a34a',
    ramp: { 50: '#f0fdf4', 100: '#dcfce7', 600: '#16a34a', 700: '#15803d' },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    swatch: '#0891b2',
    ramp: { 50: '#ecfeff', 100: '#cffafe', 600: '#0891b2', 700: '#0e7490' },
  },
  {
    id: 'coral',
    label: 'Coral',
    swatch: '#e11d48',
    ramp: { 50: '#fff1f2', 100: '#ffe4e6', 600: '#e11d48', 700: '#be123c' },
  },
  {
    id: 'plum',
    label: 'Plum',
    swatch: '#9333ea',
    ramp: { 50: '#faf5ff', 100: '#f3e8ff', 600: '#9333ea', 700: '#7e22ce' },
  },
  {
    id: 'sand',
    label: 'Sand',
    swatch: '#d97706',
    ramp: { 50: '#fffbeb', 100: '#fef3c7', 600: '#d97706', 700: '#b45309' },
  },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME_ID: ThemeId = 'leaf';

/** Falls back to the default rather than throwing — a stale persisted id must not blank the UI. */
export const themeById = (id: string): Theme =>
  THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;

export const isThemeId = (v: unknown): v is ThemeId =>
  typeof v === 'string' && THEMES.some((t) => t.id === v);

/**
 * Writes the accent ramp to the document root. Also syncs `<meta name="theme-color">`,
 * which tints browser chrome on mobile — leaving it stale would make the app read as a
 * different color than the one the user just picked.
 */
export const applyTheme = (id: ThemeId): void => {
  const theme = themeById(id);
  const root = document.documentElement;

  for (const [stop, value] of Object.entries(theme.ramp)) {
    root.style.setProperty(`--accent-${stop}`, value);
  }
  root.dataset.theme = theme.id;

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.swatch);
};
