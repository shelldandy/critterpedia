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
import { isAvailableNow } from './availability.ts';
import { compareUrgency, urgencyOf, type Urgency } from './urgency.ts';

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

/** Matches name and the raw location text, so "pier" and "palm" both find their critters. */
const matchesQuery = (c: Critter, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return (
    c.name.toLowerCase().includes(q) ||
    (c.whereHow?.toLowerCase().includes(q) ?? false)
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

const byName = (a: Urgency, b: Urgency): number =>
  a.critter.name.localeCompare(b.critter.name);

/*
  Every comparator falls back to name so the order is total and stable — without it,
  the 40-odd critters that share a sell price would shuffle between renders.
*/
const COMPARATORS: Record<SortKey, (a: Urgency, b: Urgency) => number> = {
  // Handled by rankCatchableNow's own comparator; present so the map is total.
  urgency: byName,
  name: byName,
  'sell-desc': (a, b) => b.critter.sell - a.critter.sell || byName(a, b),
  'sell-asc': (a, b) => a.critter.sell - b.critter.sell || byName(a, b),
  shadow: (a, b) => shadowRank(a.critter) - shadowRank(b.critter) || byName(a, b),
  rarity: (a, b) => rarityScore(a) - rarityScore(b) || byName(a, b),
};

export const SORT_LABELS: Record<SortKey, string> = {
  urgency: 'Urgency',
  name: 'Name (A–Z)',
  'sell-desc': 'Price (high → low)',
  'sell-asc': 'Price (low → high)',
  shadow: 'Shadow size',
  rarity: 'Rarity',
};

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
): Urgency[] => {
  const pool =
    f.scope === 'now'
      ? critters.filter((c) => isAvailableNow(c, now, hemi))
      : critters;

  const items = pool
    .filter((c) => matchesFilter(c, f))
    .map((c) => urgencyOf(c, now, hemi));

  return items.sort(f.sort === 'urgency' ? compareUrgency : COMPARATORS[f.sort]);
};
