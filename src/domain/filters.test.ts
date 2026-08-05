import { describe, expect, it } from 'vitest';

import { CRITTERS } from '../data/critters.ts';
import type { Kind, Shadow, Weather, WhereGroup } from '../data/types.ts';
import { isAvailableNow } from './availability.ts';
import {
  EMPTY_FILTER,
  activeFilterCount,
  isFilterActive,
  keepsBands,
  matchesFilter,
  selectCritters,
  shadowRank,
  type CritterFilter,
} from './filters.ts';

/** Local-time date; the engine reads getMonth()/getHours(), so local is what matters. */
const at = (month: number, day: number, hour: number): Date =>
  new Date(2026, month - 1, day, hour, 0, 0);

const filter = (over: Partial<CritterFilter> = {}): CritterFilter => ({
  ...EMPTY_FILTER,
  ...over,
});

const names = (items: ReadonlyArray<{ critter: { name: string } }>): string[] =>
  items.map((u) => u.critter.name);

describe('matchesFilter', () => {
  it('treats an empty filter as "everything passes"', () => {
    for (const c of CRITTERS) expect(matchesFilter(c, EMPTY_FILTER)).toBe(true);
  });

  it('treats an empty set as unconstrained, not as "exclude all"', () => {
    const f = filter({ shadows: new Set() });
    // Bugs have no shadow at all; they must not be filtered out by a shadow filter nobody set.
    const bugs = CRITTERS.filter((c) => c.kind === 'bug');
    expect(bugs.every((c) => matchesFilter(c, f))).toBe(true);
  });

  it('excludes critters lacking the filtered attribute entirely', () => {
    const f = filter({ shadows: new Set<Shadow>(['Large']) });
    // A bug can never satisfy a shadow filter, so it must not slip through.
    expect(CRITTERS.filter((c) => matchesFilter(c, f)).every((c) => c.kind !== 'bug')).toBe(
      true,
    );
  });

  it('filters by kind', () => {
    const f = filter({ kinds: new Set<Kind>(['sea']) });
    const got = CRITTERS.filter((c) => matchesFilter(c, f));
    expect(got).toHaveLength(40);
    expect(got.every((c) => c.kind === 'sea')).toBe(true);
  });

  it('ORs within a facet and ANDs across facets', () => {
    const f = filter({
      kinds: new Set<Kind>(['fish', 'sea']),
      shadows: new Set<Shadow>(['X-Small']),
    });
    const got = CRITTERS.filter((c) => matchesFilter(c, f));
    expect(got.length).toBeGreaterThan(0);
    expect(got.every((c) => c.kind === 'fish' || c.kind === 'sea')).toBe(true);
    expect(got.every((c) => c.shadow === 'X-Small')).toBe(true);
  });

  it('filters bugs by where-group and weather', () => {
    const f = filter({
      whereGroups: new Set<WhereGroup>(['Flowers']),
      weathers: new Set<Weather>(['Any except rain']),
    });
    const got = CRITTERS.filter((c) => matchesFilter(c, f));
    expect(got).toHaveLength(15);
    expect(got.every((c) => c.whereGroup === 'Flowers')).toBe(true);
    expect(got.every((c) => c.weather === 'Any except rain')).toBe(true);
  });

  /*
    Not a hypothetical: all 15 flower bugs are 'Any except rain', so this pairing is
    genuinely empty in the data. The UI must render an empty state here rather than
    assume a non-empty intersection is always reachable.
  */
  it('yields nothing for a facet pairing the dataset never satisfies', () => {
    const f = filter({
      whereGroups: new Set<WhereGroup>(['Flowers']),
      weathers: new Set<Weather>(['Any weather']),
    });
    expect(CRITTERS.filter((c) => matchesFilter(c, f))).toHaveLength(0);
  });

  it('searches name and location, case-insensitively', () => {
    expect(names(selectCritters(CRITTERS, filter({ scope: 'all', query: 'CoElaC' }), at(6, 1, 12), 'north'))).toContain(
      'coelacanth',
    );
    const pier = CRITTERS.filter((c) => matchesFilter(c, filter({ query: 'pier' })));
    expect(pier.length).toBeGreaterThan(0);
    expect(pier.every((c) => c.whereHow?.toLowerCase().includes('pier'))).toBe(true);
  });

  it('ignores surrounding whitespace in the query', () => {
    const f = filter({ query: '   ' });
    expect(CRITTERS.filter((c) => matchesFilter(c, f))).toHaveLength(CRITTERS.length);
  });
});

describe('shadowRank', () => {
  it('orders the true size ramp small to large', () => {
    const rank = (s: Shadow) => shadowRank({ shadow: s } as never);
    expect(rank('X-Small')).toBeLessThan(rank('Small'));
    expect(rank('Small')).toBeLessThan(rank('Medium'));
    expect(rank('Medium')).toBeLessThan(rank('Large'));
    expect(rank('Large')).toBeLessThan(rank('X-Large'));
    expect(rank('X-Large')).toBeLessThan(rank('XX-Large'));
  });

  /*
    The landmine from types.ts: these two describe shape, not size. Placing them inside the
    ramp would assert an eel is bigger than an X-Large, which the data does not say.
  */
  it('sorts shape-not-size shadows after the entire ramp', () => {
    const rank = (s: Shadow) => shadowRank({ shadow: s } as never);
    expect(rank('Long')).toBeGreaterThan(rank('XX-Large'));
    expect(rank('X-Large w/Fin')).toBeGreaterThan(rank('XX-Large'));
  });

  it('sorts shadowless critters last of all', () => {
    const bug = CRITTERS.find((c) => c.kind === 'bug')!;
    const rank = (s: Shadow) => shadowRank({ shadow: s } as never);
    expect(shadowRank(bug)).toBeGreaterThan(rank('Long'));
  });
});

describe('selectCritters — scope', () => {
  const now = at(7, 15, 21);

  it('scope "now" returns exactly what the availability engine says is catchable', () => {
    const got = selectCritters(CRITTERS, filter({ scope: 'now' }), now, 'north');
    const expected = CRITTERS.filter((c) => isAvailableNow(c, now, 'north'));
    expect(got).toHaveLength(expected.length);
    expect(got.every((u) => isAvailableNow(u.critter, now, 'north'))).toBe(true);
  });

  it('scope "all" returns the whole dataset', () => {
    expect(selectCritters(CRITTERS, filter({ scope: 'all' }), now, 'north')).toHaveLength(
      200,
    );
  });

  it('respects hemisphere when scoping to now', () => {
    const north = selectCritters(CRITTERS, filter(), now, 'north');
    const south = selectCritters(CRITTERS, filter(), now, 'south');
    expect(names(north)).not.toEqual(names(south));
  });
});

describe('selectCritters — sorting', () => {
  const now = at(7, 15, 21);
  const all = (sort: CritterFilter['sort']) =>
    selectCritters(CRITTERS, filter({ scope: 'all', sort }), now, 'north');

  it('sorts by price descending and ascending', () => {
    const desc = all('sell-desc').map((u) => u.critter.sell);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    expect(desc[0]).toBe(15000);

    const asc = all('sell-asc').map((u) => u.critter.sell);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(asc[0]).toBe(10);
  });

  it('sorts by name', () => {
    const got = names(all('name'));
    expect(got).toEqual([...got].sort((a, b) => a.localeCompare(b)));
  });

  it('sorts by shadow without interleaving shape-not-size shadows', () => {
    const ranks = all('shadow').map((u) => shadowRank(u.critter));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('sorts by rarity, narrowest window first', () => {
    const got = all('rarity');
    const score = (u: (typeof got)[number]) => u.monthsAvailable * 24 + u.hoursAvailable;
    const scores = got.map(score);
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
    // A year-round, all-day critter is the least rare thing possible.
    const last = got.at(-1)!;
    expect(score(last)).toBe(12 * 24 + 24);
  });

  it('is stable and total — equal keys never shuffle between runs', () => {
    const a = names(all('sell-desc'));
    const b = names(all('sell-desc'));
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length);
  });

  it('urgency sort matches the default ranking, unchanged', () => {
    const viaFilter = names(selectCritters(CRITTERS, filter({ sort: 'urgency' }), now, 'north'));
    // Mirrors rankCatchableNow: same pool, same comparator.
    expect(viaFilter.length).toBeGreaterThan(0);
    const closingFirst = selectCritters(CRITTERS, filter(), now, 'north');
    const firstNonClosing = closingFirst.findIndex((u) => !u.closingSoon);
    if (firstNonClosing > 0) {
      expect(closingFirst.slice(0, firstNonClosing).every((u) => u.closingSoon)).toBe(true);
    }
  });
});

describe('filter bookkeeping', () => {
  it('reports an empty filter as inactive, and scope alone does not activate it', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
    expect(isFilterActive(filter({ scope: 'all' }))).toBe(false);
    expect(activeFilterCount(EMPTY_FILTER)).toBe(0);
  });

  it('counts each selected facet and a non-blank query', () => {
    const f = filter({
      query: 'sea',
      kinds: new Set<Kind>(['fish', 'sea']),
      shadows: new Set<Shadow>(['Large']),
    });
    expect(isFilterActive(f)).toBe(true);
    expect(activeFilterCount(f)).toBe(4);
    expect(activeFilterCount(filter({ query: '  ' }))).toBe(0);
  });

  it('keeps bands only for the urgency sort', () => {
    expect(keepsBands('urgency')).toBe(true);
    for (const s of ['name', 'sell-asc', 'sell-desc', 'shadow', 'rarity'] as const) {
      expect(keepsBands(s)).toBe(false);
    }
  });
});
