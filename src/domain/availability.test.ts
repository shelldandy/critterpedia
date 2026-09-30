import { describe, expect, it } from 'vitest';

import { CRITTERS } from '../data/critters.ts';
import type { Critter, Hemisphere } from '../data/types.ts';
import {
  availableNow,
  hoursUntilGone,
  isAllDay,
  isAvailableAt,
  isArrivingNextMonth,
  isAvailableNow,
  isLeavingAfterThisMonth,
  isYearRound,
  windowFor,
} from './availability.ts';

const find = (name: string): Critter => {
  const c = CRITTERS.find((x) => x.name === name);
  if (!c) throw new Error(`fixture missing: ${name}`);
  return c;
};

/** Local-time date; the engine reads getMonth()/getHours(), so local is what matters. */
const at = (month: number, day: number, hour: number): Date =>
  new Date(2026, month - 1, day, hour, 0, 0);

describe('dataset invariants', () => {
  it('has 80 fish, 80 bugs, 40 sea creatures', () => {
    const count = (k: string) => CRITTERS.filter((c) => c.kind === k).length;
    expect(count('fish')).toBe(80);
    expect(count('bug')).toBe(80);
    expect(count('sea')).toBe(40);
  });

  it('has no nested availability arrays left', () => {
    for (const c of CRITTERS) {
      for (const hemi of ['north', 'south'] as const) {
        const w = windowFor(c, hemi);
        expect(w.hours.every((h) => typeof h === 'number')).toBe(true);
        expect(w.months.every((m) => typeof m === 'number')).toBe(true);
      }
    }
  });

  it('keeps every hour in 0-23 and every month in 1-12', () => {
    for (const c of CRITTERS) {
      for (const hemi of ['north', 'south'] as const) {
        const w = windowFor(c, hemi);
        for (const h of w.hours) expect(h).toBeGreaterThanOrEqual(0);
        for (const h of w.hours) expect(h).toBeLessThanOrEqual(23);
        for (const m of w.months) expect(m).toBeGreaterThanOrEqual(1);
        for (const m of w.months) expect(m).toBeLessThanOrEqual(12);
      }
    }
  });

  it('gives every critter a unique id', () => {
    expect(new Set(CRITTERS.map((c) => c.id)).size).toBe(CRITTERS.length);
  });

  it('never assigns a shadow to a bug, and always a speed to a sea creature', () => {
    for (const c of CRITTERS) {
      if (c.kind === 'bug') expect(c.shadow).toBeUndefined();
      if (c.kind === 'sea') expect(c.movementSpeed).toBeDefined();
    }
  });

  it('buckets every bug location', () => {
    for (const c of CRITTERS.filter((x) => x.kind === 'bug')) {
      expect(c.whereGroup).toBeDefined();
    }
  });

  it('strips non-breaking spaces from display text', () => {
    for (const c of CRITTERS) {
      for (const hemi of ['north', 'south'] as const) {
        const w = windowFor(c, hemi);
        for (const s of [...w.hoursText, ...w.monthsText]) {
          expect(s).not.toContain(' ');
        }
      }
    }
  });
});

/**
 * The regression that matters most. Four species ship nested per-window hour arrays
 * upstream; a naive `timeArray.includes(hour)` returns false for all of them, silently
 * hiding exactly the rare critters this app exists to help find.
 */
describe('nested-array regression (piranha, evening cicada, walking stick, giant isopod)', () => {
  it('piranha is catchable midday and overnight, but not at 6 PM', () => {
    const piranha = find('piranha');
    // North: Jun-Sep, 9 AM - 4 PM and 9 PM - 4 AM.
    expect(isAvailableNow(piranha, at(7, 15, 12), 'north')).toBe(true);
    expect(isAvailableNow(piranha, at(7, 15, 23), 'north')).toBe(true);
    expect(isAvailableNow(piranha, at(7, 15, 2), 'north')).toBe(true);
    expect(isAvailableNow(piranha, at(7, 15, 18), 'north')).toBe(false);
    expect(isAvailableAt(piranha, 7, 12, 'north')).toBe(true);
    expect(isAvailableAt(piranha, 7, 18, 'north')).toBe(false);
  });

  it('evening cicada is catchable at 6 PM but not at noon', () => {
    const cicada = find('evening cicada');
    // North: Jul-Aug, 4-8 AM and 4-7 PM.
    expect(isAvailableNow(cicada, at(7, 15, 18), 'north')).toBe(true);
    expect(isAvailableNow(cicada, at(7, 15, 5), 'north')).toBe(true);
    expect(isAvailableNow(cicada, at(7, 15, 12), 'north')).toBe(false);
  });

  it('walking stick is catchable at dawn and dusk but not at noon', () => {
    const stick = find('walking stick');
    expect(isAvailableNow(stick, at(9, 15, 5), 'north')).toBe(true);
    expect(isAvailableNow(stick, at(9, 15, 18), 'north')).toBe(true);
    expect(isAvailableNow(stick, at(9, 15, 12), 'north')).toBe(false);
  });

  it('giant isopod is catchable midday and overnight but not at 6 PM', () => {
    const isopod = find('giant isopod');
    expect(isAvailableNow(isopod, at(8, 15, 12), 'north')).toBe(true);
    expect(isAvailableNow(isopod, at(8, 15, 23), 'north')).toBe(true);
    expect(isAvailableNow(isopod, at(8, 15, 18), 'north')).toBe(false);
  });

  it('covers both hemispheres for every nested-array species', () => {
    for (const name of ['piranha', 'evening cicada', 'walking stick', 'giant isopod']) {
      const c = find(name);
      for (const hemi of ['north', 'south'] as const) {
        const w = windowFor(c, hemi);
        // Two disjoint windows always survive as more than one display string.
        expect(w.hoursText.length).toBeGreaterThan(1);
        // ...and fewer hours than an all-day critter.
        expect(w.hours.length).toBeLessThan(24);
      }
    }
  });
});

describe('selected month/hour availability', () => {
  it('allows either dimension to be unconstrained', () => {
    const angelfish = find('angelfish');
    expect(isAvailableAt(angelfish, 'any', 2, 'north')).toBe(true);
    expect(isAvailableAt(angelfish, 7, 'any', 'north')).toBe(true);
    expect(isAvailableAt(angelfish, 'any', 12, 'north')).toBe(false);
  });

  it('keeps midnight-spanning critters catchable with any month at hour 2', () => {
    expect(isAvailableAt(find('angelfish'), 'any', 2, 'north')).toBe(true);
    expect(isAvailableAt(find('piranha'), 'any', 2, 'north')).toBe(true);
  });
});

describe('midnight-spanning windows', () => {
  it('treats angelfish as available at 11 PM and 2 AM but not at noon', () => {
    const angelfish = find('angelfish');
    // North: May-Oct, 4 PM - 9 AM.
    expect(isAvailableNow(angelfish, at(7, 15, 23), 'north')).toBe(true);
    expect(isAvailableNow(angelfish, at(7, 15, 2), 'north')).toBe(true);
    expect(isAvailableNow(angelfish, at(7, 15, 12), 'north')).toBe(false);
  });
});

describe('year-round and all-day critters', () => {
  it('finds 38 year-round and 91 all-day critters in the north', () => {
    expect(CRITTERS.filter((c) => isYearRound(c, 'north')).length).toBe(38);
    expect(CRITTERS.filter((c) => isAllDay(c, 'north')).length).toBe(91);
  });

  it('never flags a year-round critter as leaving, in any month or hemisphere', () => {
    for (const hemi of ['north', 'south'] as const) {
      const yearRound = CRITTERS.filter((c) => isYearRound(c, hemi));
      for (const c of yearRound) {
        for (let m = 1; m <= 12; m++) {
          expect(isLeavingAfterThisMonth(c, at(m, 15, 12), hemi)).toBe(false);
          expect(isArrivingNextMonth(c, at(m, 15, 12), hemi)).toBe(false);
        }
      }
    }
  });

  it('keeps an all-day critter available at all 24 hours', () => {
    const allDay = CRITTERS.find(
      (c) => isAllDay(c, 'north') && isYearRound(c, 'north'),
    );
    expect(allDay).toBeDefined();
    for (let h = 0; h < 24; h++) {
      expect(isAvailableNow(allDay as Critter, at(6, 15, h), 'north')).toBe(true);
    }
  });
});

describe('leaving / arriving', () => {
  it('flags exactly tadpole, honeybee and seaweed as leaving after July (north)', () => {
    const leaving = CRITTERS.filter((c) =>
      isLeavingAfterThisMonth(c, at(7, 31, 12), 'north'),
    ).map((c) => c.name);
    expect(leaving.sort()).toEqual(['honeybee', 'seaweed', 'tadpole']);
  });

  it('wraps December to January', () => {
    const leaving = CRITTERS.filter((c) =>
      isLeavingAfterThisMonth(c, at(12, 31, 12), 'north'),
    ).map((c) => c.name);
    expect(leaving.sort()).toEqual(['mussel', 'pike', 'spiny lobster', 'turban shell']);
  });

  it('handles a multi-window species (blue marlin leaves after Apr and Sep only)', () => {
    const marlin = find('blue marlin');
    const flagged: number[] = [];
    for (let m = 1; m <= 12; m++) {
      if (isLeavingAfterThisMonth(marlin, at(m, 15, 12), 'north')) flagged.push(m);
    }
    expect(flagged).toEqual([4, 9]);
  });

  it('never reports a critter as both leaving and arriving', () => {
    for (const c of CRITTERS) {
      for (let m = 1; m <= 12; m++) {
        const now = at(m, 15, 12);
        const both =
          isLeavingAfterThisMonth(c, now, 'north') &&
          isArrivingNextMonth(c, now, 'north');
        expect(both).toBe(false);
      }
    }
  });
});

describe('hoursUntilGone', () => {
  it('returns null for an all-day critter', () => {
    const sable = CRITTERS.find((c) => isAllDay(c, 'north') && isYearRound(c, 'north'));
    expect(hoursUntilGone(sable as Critter, at(6, 15, 12), 'north')).toBeNull();
  });

  it('returns 0 when the critter is not currently available', () => {
    const cicada = find('evening cicada');
    expect(hoursUntilGone(cicada, at(7, 15, 12), 'north')).toBe(0);
  });

  it('counts the remaining hours in the current run', () => {
    const cicada = find('evening cicada');
    // Window is 16,17,18 — at 17:00 there are 2 hours left (17 and 18).
    expect(hoursUntilGone(cicada, at(7, 15, 17), 'north')).toBe(2);
    expect(hoursUntilGone(cicada, at(7, 15, 18), 'north')).toBe(1);
  });

  it('counts across midnight without breaking at the day boundary', () => {
    const angelfish = find('angelfish');
    // 4 PM - 9 AM: at 23:00 the run continues to 08:00, so 10 hours remain.
    expect(hoursUntilGone(angelfish, at(7, 15, 23), 'north')).toBe(10);
  });
});

describe('hemispheres', () => {
  it('inverts the seasons — Napoleonfish is Jul-Aug north, Jan-Feb south', () => {
    const fish = find('Napoleonfish');
    expect(windowFor(fish, 'north').months).toEqual([7, 8]);
    expect(windowFor(fish, 'south').months).toEqual([1, 2]);
    expect(isAvailableNow(fish, at(7, 15, 12), 'north')).toBe(true);
    expect(isAvailableNow(fish, at(7, 15, 12), 'south')).toBe(false);
    expect(isAvailableNow(fish, at(1, 15, 12), 'south')).toBe(true);
  });
});

describe('catchable-count snapshots', () => {
  const cases: ReadonlyArray<[Date, Hemisphere]> = [
    [at(1, 15, 3), 'north'],
    [at(7, 15, 12), 'north'],
    [at(7, 15, 12), 'south'],
    [at(12, 31, 23), 'north'],
  ];

  it('matches the pinned counts (catches broad pipeline drift)', () => {
    const counts = cases.map(([now, hemi]) => availableNow(CRITTERS, now, hemi).length);
    expect(counts).toMatchInlineSnapshot(`
      [
        62,
        101,
        54,
        66,
      ]
    `);
  });
});
