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
import {
  isAvailableAt,
  isAllDay,
  isLeavingAfterThisMonth,
  isNewThisMonth,
  isYearRound,
  windowFor,
} from './availability.ts';
import { compareUrgencyIn, type Urgency } from './urgency.ts';

export type MonthStatus = 'all' | 'new' | 'leaving';

export type SortKey =
  | 'number'
  | 'urgency'
  | 'name'
  | 'sell-desc'
  | 'sell-asc'
  | 'shadow'
  | 'rarity';

export interface CritterFilter {
  /** Free text over name and location. Empty means no text constraint. */
  query: string;
  /** Empty set means "no kind constraint" — never means "show nothing". */
  kinds: Set<Kind>;
  shadows: Set<Shadow>;
  whereGroups: Set<WhereGroup>;
  weathers: Set<Weather>;
  /** Restrict results to critters newly available or leaving in the current month. */
  monthStatus: MonthStatus;
  sort: SortKey;
}

export const EMPTY_FILTER: CritterFilter = {
  query: '',
  kinds: new Set(),
  shadows: new Set(),
  whereGroups: new Set(),
  weathers: new Set(),
  monthStatus: 'all',
  sort: 'number',
};

export interface ResolvedWhen {
  month: number | 'any';
  hour: number | 'any';
  isLive: boolean;
}

/** No specific month/hour is selected for availability or urgency. */
export const ANY_WHEN: ResolvedWhen = { month: 'any', hour: 'any', isLive: false };

/** True when the filter would show a subset of the full critter list. */
export const isFilterActive = (f: CritterFilter): boolean =>
  f.query.trim() !== '' ||
  f.kinds.size > 0 ||
  f.shadows.size > 0 ||
  f.whereGroups.size > 0 ||
  f.weathers.size > 0 ||
  f.monthStatus !== 'all';

export const activeFilterCount = (f: CritterFilter): number =>
  (f.query.trim() === '' ? 0 : 1) +
  f.kinds.size +
  f.shadows.size +
  f.whereGroups.size +
  f.weathers.size +
  (f.monthStatus === 'all' ? 0 : 1);

/**
 * An empty set is "unconstrained", not "exclude everything" — a bug (which has no shadow
 * at all) must survive a filter nobody selected.
 */
const passesSet = <T>(selected: ReadonlySet<T>, value: T | undefined): boolean =>
  selected.size === 0 || (value !== undefined && selected.has(value));

/** Accent-insensitive search key shared by both localized names and locations. */
export const foldForSearch = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Search both names regardless of the active display language. */
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

const matchesMonthStatus = (
  c: Critter,
  status: MonthStatus,
  now: Date,
  hemi: Hemisphere,
): boolean =>
  status === 'all' ||
  (status === 'new' ? isNewThisMonth(c, now, hemi) : isLeavingAfterThisMonth(c, now, hemi));

const SHADOW_RAMP: readonly Shadow[] = [
  'X-Small',
  'Small',
  'Medium',
  'Large',
  'X-Large',
  'XX-Large',
];

export const shadowRank = (c: Critter): number => {
  if (!c.shadow) return SHADOW_RAMP.length + 2;
  const i = SHADOW_RAMP.indexOf(c.shadow);
  return i === -1 ? SHADOW_RAMP.length + 1 : i;
};

/** Narrower window = rarer. Months dominate hours. */
const rarityScore = (u: Urgency): number => u.monthsAvailable * 24 + u.hoursAvailable;

const nameComparator = (lang: Lang): ((a: Urgency, b: Urgency) => number) => {
  const collator = new Intl.Collator(localeOf(lang), {
    sensitivity: 'variant',
    numeric: true,
  });
  return (a, b) => collator.compare(nameIn(a.critter, lang), nameIn(b.critter, lang));
};

const KIND_ORDER: readonly Kind[] = ['fish', 'bug', 'sea'];
const kindRank = (kind: Kind): number => KIND_ORDER.indexOf(kind);

const comparatorsFor = (
  lang: Lang,
): Record<SortKey, (a: Urgency, b: Urgency) => number> => {
  const byName = nameComparator(lang);
  return {
    number: (a, b) =>
      kindRank(a.critter.kind) - kindRank(b.critter.kind) ||
      a.critter.num - b.critter.num ||
      byName(a, b),
    // The flat grid keeps urgency ordering without rendering urgency bands.
    urgency: compareUrgencyIn(lang),
    name: byName,
    'sell-desc': (a, b) => b.critter.sell - a.critter.sell || byName(a, b),
    'sell-asc': (a, b) => a.critter.sell - b.critter.sell || byName(a, b),
    shadow: (a, b) => shadowRank(a.critter) - shadowRank(b.critter) || byName(a, b),
    rarity: (a, b) => rarityScore(a) - rarityScore(b) || byName(a, b),
  };
};

export const sortLabels = (t: Messages): Record<SortKey, string> => ({
  number: t.sortNumber,
  urgency: t.sortUrgency,
  name: t.sortName,
  'sell-desc': t.sortPriceDesc,
  'sell-asc': t.sortPriceAsc,
  shadow: t.sortShadow,
  rarity: t.sortRarity,
});

export const SORT_ORDER: readonly SortKey[] = [
  'number',
  'urgency',
  'rarity',
  'sell-desc',
  'sell-asc',
  'shadow',
  'name',
];

/** Availability statistics used by non-live sorts without making hypothetical urgency claims. */
const staticUrgency = (c: Critter, hemi: Hemisphere): Urgency => {
  const w = windowFor(c, hemi);
  return {
    critter: c,
    leavingThisMonth: false,
    newThisMonth: false,
    hoursLeft: null,
    closingSoon: false,
    monthsAvailable: isYearRound(c, hemi) ? 12 : w.months.length,
    hoursAvailable: isAllDay(c, hemi) ? 24 : w.hours.length,
  };
};

export interface SelectedCritter extends Urgency {
  /** Whether this entry is catchable at the filter's resolved month/hour. */
  available: boolean;
}

/** The one entry point the UI calls: apply filters → rank. */
export const selectCritters = (
  critters: readonly Critter[],
  f: CritterFilter,
  now: Date,
  hemi: Hemisphere,
  lang: Lang = DEFAULT_LANG,
): SelectedCritter[] => {
  const items = critters
    .filter((c) => matchesFilter(c, f))
    .filter((c) => matchesMonthStatus(c, f.monthStatus, now, hemi))
    .map((c): SelectedCritter => ({
      ...staticUrgency(c, hemi),
      available: isAvailableAt(c, ANY_WHEN.month, ANY_WHEN.hour, hemi),
    }));

  return items.sort(comparatorsFor(lang)[f.sort]);
};
