/**
 * Filtering and sorting — the narrowing layer between "what exists" and "what's on screen".
 *
 * Like `availability.ts`, everything here is pure and takes an explicit `now`. Nothing reads
 * the clock or touches React, so the whole surface is testable without mocking.
 */

import type {
  Critter,
  Hemisphere,
  Kind,
  Shadow,
  Weather,
  WhereGroup,
} from '../data/types.ts';
import { DEFAULT_LANG, localeOf, nameIn, type Lang } from '../i18n/lang.ts';
import type { Messages } from '../i18n/messages.ts';
import { isAvailableNow } from './availability.ts';
import { compareUrgencyIn, urgencyOf, type Urgency } from './urgency.ts';

/**
 * 'now' = catchable this hour (the app's core promise). 'all' = the full 200, for
 * reverse-lookup and planning. Scope is deliberately separate from the filters: it
 * changes which question is being asked, not merely how the answer is narrowed.
 */
export type Scope = 'now' | 'all';

export type SortKey =
  | 'urgency'
  | 'name'
  | 'sell-desc'
  | 'sell-asc'
  | 'shadow'
  | 'rarity';

export interface CritterFilter {
  scope: Scope;
  /** Free text over name and location. Empty means no text constraint. */
  query: string;
  /** Empty set means "no kind constraint" — never means "show nothing". */
  kinds: Set<Kind>;
  shadows: Set<Shadow>;
  whereGroups: Set<WhereGroup>;
  weathers: Set<Weather>;
  sort: SortKey;
}

export const EMPTY_FILTER: CritterFilter = {
  scope: 'now',
  query: '',
  kinds: new Set(),
  shadows: new Set(),
  whereGroups: new Set(),
  weathers: new Set(),
  sort: 'urgency',
};

/**
 * True when the filter would show everything in its scope. Drives the "Clear" affordance —
 * scope is excluded on purpose, since switching to All critters is not a filter to clear.
 */
export const isFilterActive = (f: CritterFilter): boolean =>
  f.query.trim() !== '' ||
  f.kinds.size > 0 ||
  f.shadows.size > 0 ||
  f.whereGroups.size > 0 ||
  f.weathers.size > 0;

export const activeFilterCount = (f: CritterFilter): number =>
  (f.query.trim() === '' ? 0 : 1) +
  f.kinds.size +
  f.shadows.size +
  f.whereGroups.size +
  f.weathers.size;

/**
 * An empty set is "unconstrained", not "exclude everything" — a user who has ticked no
 * shadow boxes wants all shadows, and a bug (which has no shadow at all) must survive a
 * filter it cannot possibly answer.
 */
const passesSet = <T>(selected: ReadonlySet<T>, value: T | undefined): boolean =>
  selected.size === 0 || (value !== undefined && selected.has(value));

/**
 * Case- and accent-insensitive search key. NFD splits an accented char into base + combining
 * mark, and the range strip drops the marks, so "napoleon" matches "pez napoleón" and
 * "anemona" matches "anémona". Without this, a Spanish-language user typing on a keyboard
 * without dead keys would silently get zero results for a critter that is right there.
 */
export const foldForSearch = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    // U+0300..U+036F is the combining-diacritics block, written as escapes because
    // the literal characters are invisible in an editor and a reformat could gut this.
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Matches location text plus the name in BOTH languages, regardless of display language.
 * Deliberately not scoped to the active language: a bilingual player knows some critters
 * by one name and some by the other, and hiding the English index in Spanish mode would
 * make the search worse for exactly the audience that switched.
 */
const matchesQuery = (c: Critter, query: string): boolean => {
  const q = foldForSearch(query.trim());
  if (q === '') return true;
  return (
    foldForSearch(c.name).includes(q) ||
    foldForSearch(c.nameEs).includes(q) ||
    (c.whereHow ? foldForSearch(c.whereHow).includes(q) : false)
  );
};

export const matchesFilter = (c: Critter, f: CritterFilter): boolean =>
  passesSet(f.kinds, c.kind) &&
  passesSet(f.shadows, c.shadow) &&
  passesSet(f.whereGroups, c.whereGroup) &&
  passesSet(f.weathers, c.weather) &&
  matchesQuery(c, f.query);

/**
 * Size ramp for shadow sorting. `Long` and `X-Large w/Fin` describe *shape*, not size, so
 * they are deliberately absent — `shadowRank` sorts them to the end as a labelled group
 * rather than lying about where an eel sits between a Large and an X-Large.
 */
const SHADOW_RAMP: readonly Shadow[] = [
  'X-Small',
  'Small',
  'Medium',
  'Large',
  'X-Large',
  'XX-Large',
];

/** Sorts unranked shapes and shadowless bugs after the ramp instead of interleaving them. */
export const shadowRank = (c: Critter): number => {
  if (!c.shadow) return SHADOW_RAMP.length + 2;
  const i = SHADOW_RAMP.indexOf(c.shadow);
  return i === -1 ? SHADOW_RAMP.length + 1 : i;
};

/** Narrower window = rarer. Months dominate hours: a June-only fish is rarer than a night-only one. */
const rarityScore = (u: Urgency): number => u.monthsAvailable * 24 + u.hoursAvailable;

/**
 * Name comparator for the active language, built once per sort rather than per comparison.
 *
 * `Intl.Collator` (not bare `localeCompare`) because Spanish ordering is not codepoint
 * ordering: a collator puts "ñ" after "n" and treats accented vowels as equal to their base
 * for primary ordering, so "pez ángel" and "pez anguila" sort sensibly against each other.
 * Reusing one instance also avoids re-parsing locale data on every one of the ~200·log(200)
 * comparisons.
 */
const nameComparator = (lang: Lang): ((a: Urgency, b: Urgency) => number) => {
  const collator = new Intl.Collator(localeOf(lang), {
    sensitivity: 'variant',
    numeric: true,
  });
  return (a, b) => collator.compare(nameIn(a.critter, lang), nameIn(b.critter, lang));
};

/*
  Every comparator falls back to name so the order is total and stable — without it,
  the 40-odd critters that share a sell price would shuffle between renders. The fallback
  follows the displayed language, so a list sorted by price reads in a consistent order
  rather than tie-breaking on names the user cannot see.
*/
const comparatorsFor = (
  lang: Lang,
): Record<SortKey, (a: Urgency, b: Urgency) => number> => {
  const byName = nameComparator(lang);
  return {
    // Handled by rankCatchableNow's own comparator; present so the map is total.
    urgency: byName,
    name: byName,
    'sell-desc': (a, b) => b.critter.sell - a.critter.sell || byName(a, b),
    'sell-asc': (a, b) => a.critter.sell - b.critter.sell || byName(a, b),
    shadow: (a, b) => shadowRank(a.critter) - shadowRank(b.critter) || byName(a, b),
    rarity: (a, b) => rarityScore(a) - rarityScore(b) || byName(a, b),
  };
};

/**
 * Sort labels for a language. The keys stay English identifiers — only the display text is
 * localized, so persisted filter state and tests are unaffected by the display language.
 */
export const sortLabels = (t: Messages): Record<SortKey, string> => ({
  urgency: t.sortUrgency,
  name: t.sortName,
  'sell-desc': t.sortPriceDesc,
  'sell-asc': t.sortPriceAsc,
  shadow: t.sortShadow,
  rarity: t.sortRarity,
});

export const SORT_ORDER: readonly SortKey[] = [
  'urgency',
  'rarity',
  'sell-desc',
  'sell-asc',
  'shadow',
  'name',
];

/**
 * Urgency is the only sort whose meaning depends on the band grouping, so it is also the
 * only one the UI keeps bands for. Any explicit sort flattens to a single list — a list
 * claiming to be sorted by price must actually be in price order end to end.
 */
export const keepsBands = (sort: SortKey): boolean => sort === 'urgency';

/**
 * The one entry point the UI calls: scope → filter → rank.
 *
 * Urgency data is computed for every result regardless of scope, so a card in the All
 * view can still show "last month to catch". For a critter that is out of season entirely,
 * `hoursLeft` is 0 and the urgency flags are false — accurate, and the card renders no badge.
 */
export const selectCritters = (
  critters: readonly Critter[],
  f: CritterFilter,
  now: Date,
  hemi: Hemisphere,
  /** Display language — drives name sorting and every comparator's tiebreak. */
  lang: Lang = DEFAULT_LANG,
): Urgency[] => {
  const pool =
    f.scope === 'now'
      ? critters.filter((c) => isAvailableNow(c, now, hemi))
      : critters;

  const items = pool
    .filter((c) => matchesFilter(c, f))
    .map((c) => urgencyOf(c, now, hemi));

  return items.sort(
    f.sort === 'urgency' ? compareUrgencyIn(lang) : comparatorsFor(lang)[f.sort],
  );
};
