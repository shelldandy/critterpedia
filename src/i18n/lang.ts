/**
 * Display language for critter names.
 *
 * Deliberately NOT a general i18n layer: the app's UI chrome stays English, and this
 * switches only the critter *names*, which is the one place the game's own localization
 * is what players actually memorize. Adding a `t()` catalog for the chrome is a separate,
 * larger job; conflating the two would have meant shipping half a translation.
 *
 * Spanish here means the Americas (Mexican) localization — upstream `translations.uSes`.
 * See the divergence table in `scripts/build-data.ts` for why that is not `eUes`.
 *
 * Mirrors the module shape of `theme/scheme.ts`: a const list, a derived union, a default,
 * a type guard for the persisted-value boundary, and a DOM writer.
 */

import type { Critter } from '../data/types.ts';

export const LANGS = [
  { id: 'en', label: 'EN', title: 'English names' },
  { id: 'es', label: 'ES', title: 'Nombres en español' },
] as const;

export type Lang = (typeof LANGS)[number]['id'];

export const DEFAULT_LANG: Lang = 'en';

export const isLang = (v: unknown): v is Lang =>
  typeof v === 'string' && LANGS.some((l) => l.id === v);

/**
 * BCP-47 tag for `Intl` — deliberately NOT the bare `Lang` id.
 *
 * Bare 'es' resolves to peninsular conventions, where numbers under 10,000 get no grouping
 * separator at all: (5500).toLocaleString('es') is "5500", while 'es-MX' gives "5,500".
 * Since this app's Spanish is the Mexican localization, the region matters, and passing the
 * two-letter id straight to Intl would quietly format prices the wrong way.
 */
export const localeOf = (lang: Lang): string => (lang === 'es' ? 'es-MX' : 'en-US');

/**
 * The single accessor for a display name. Every render and sort site goes through this,
 * so there is exactly one place that knows which field backs which language.
 */
export const nameIn = (c: Critter, lang: Lang): string =>
  lang === 'es' ? c.nameEs : c.name;

/**
 * `<html lang>` must track the displayed language or screen readers voice Spanish with an
 * English synthesizer ("catarina" as /kəˈtærɪnə/).
 *
 * Also syncs `<title>` and the meta description, which `index.html` ships in English —
 * those are the browser-tab and share-preview text, so leaving them fixed would contradict
 * an otherwise fully translated page.
 */
export const applyLang = (lang: Lang): void => {
  const root = document.documentElement;
  root.lang = lang;

  const meta = LANG_META[lang];
  document.title = meta.title;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', meta.description);
};

/* Kept here rather than in the message catalog: these are document metadata written to the
   DOM outside React, the same way `theme/*` owns its own DOM writes. */
const LANG_META: Record<Lang, { title: string; description: string }> = {
  en: {
    title: 'Critter Companion — ACNH',
    description: 'Find what you can catch right now in Animal Crossing: New Horizons.',
  },
  es: {
    title: 'Compañero de Bichos — ACNH',
    description: 'Descubre qué puedes atrapar ahora mismo en Animal Crossing: New Horizons.',
  },
};
