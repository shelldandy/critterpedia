import { describe, expect, it } from 'vitest';

import { CRITTERS } from '../data/critters.ts';
import type { Availability } from '../data/types.ts';
import { hoursTextIn, monthsTextIn } from './availabilityText.ts';

const find = (name: string) => {
  const c = CRITTERS.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (!c) throw new Error(`No critter named ${name}`);
  return c;
};

/** Parses upstream English "4 PM – 9 AM" into 24h numbers, for cross-checking the Spanish. */
const parseEnglishRange = (s: string): [number, number] | null => {
  const m = /^(\d{1,2}) (AM|PM) – (\d{1,2}) (AM|PM)$/.exec(s);
  if (!m) return null;
  const to24 = (h: string, ap: string) => {
    const n = Number(h) % 12;
    return ap === 'PM' ? n + 12 : n;
  };
  return [to24(m[1]!, m[2]!), to24(m[3]!, m[4]!)];
};

describe('hoursTextIn (Spanish)', () => {
  it('passes English through unchanged, straight from upstream', () => {
    for (const c of CRITTERS) {
      expect(hoursTextIn(c.north, 'en')).toBe(c.north.hoursText);
      expect(hoursTextIn(c.south, 'en')).toBe(c.south.hoursText);
    }
  });

  it('renders an all-day window as a single phrase, not a 0-24 range', () => {
    // The exact trap types.ts warns about, from the other direction.
    const coelacanth = find('coelacanth');
    expect(coelacanth.north.hours).toHaveLength(24);
    expect(hoursTextIn(coelacanth.north, 'es')).toEqual(['Todo el día']);
  });

  it('stitches a midnight-spanning window into ONE range', () => {
    // barreleye: 9 PM – 4 AM. Must not render as two windows.
    const barreleye = find('barreleye');
    expect(hoursTextIn(barreleye.north, 'es')).toEqual(['21:00–4:00']);
  });

  it('renders a same-day window as a plain range', () => {
    // giant snakehead: 9 AM – 4 PM.
    expect(hoursTextIn(find('giant snakehead').north, 'es')).toEqual(['9:00–16:00']);
  });

  /**
   * The hardest shape: a daytime window AND a midnight-spanning one, i.e. three contiguous
   * runs ([0-3], [9-15], [21-23]) that must collapse to two windows — not three, and not one.
   * These are the nested-`timeArray` critters `build-data.ts` flattens.
   */
  it.each(['piranha', 'giant isopod'])(
    'keeps a daytime window separate from a wraparound window (%s)',
    (name) => {
      const c = find(name);
      expect(c.north.hoursText).toEqual(['9 AM – 4 PM', '9 PM – 4 AM']);
      expect(hoursTextIn(c.north, 'es')).toEqual(['9:00–16:00', '21:00–4:00']);
    },
  );

  it.each(['evening cicada', 'walking stick'])(
    'renders two same-day windows in clock order (%s)',
    (name) => {
      const es = hoursTextIn(find(name).north, 'es');
      expect(es).toHaveLength(2);
      expect(es[0]!.startsWith('4:00')).toBe(true);
    },
  );

  /**
   * The strongest guarantee: for every critter and hemisphere, the Spanish 24h range must
   * describe the same window as the upstream English string. A window-reconstruction bug
   * would surface here rather than in a hand-picked example.
   */
  it('agrees with the upstream English window for every critter', () => {
    for (const c of CRITTERS) {
      for (const hemi of ['north', 'south'] as const) {
        const a: Availability = c[hemi];
        const en = a.hoursText;
        const es = hoursTextIn(a, 'es');

        if (en.length === 1 && en[0] === 'All day') {
          expect(es, `${c.id} ${hemi}`).toEqual(['Todo el día']);
          continue;
        }
        /*
          Covers the 8 two-window entries too (piranha, evening cicada, walking stick,
          giant isopod — the same nested-timeArray critters build-data.ts flattens). The
          Spanish must reproduce every English window, in the same order.
        */
        const expected = en.map((s) => {
          const parsed = parseEnglishRange(s);
          expect(parsed, `${c.id} ${hemi} unparsed: ${s}`).not.toBeNull();
          const [start, end] = parsed!;
          return `${start}:00–${end}:00`;
        });
        expect(es, `${c.id} ${hemi}`).toEqual(expected);
      }
    }
  });
});

describe('monthsTextIn (Spanish)', () => {
  it('passes English through unchanged', () => {
    for (const c of CRITTERS) {
      expect(monthsTextIn(c.north, 'en')).toBe(c.north.monthsText);
    }
  });

  it('uses lowercase Spanish month abbreviations', () => {
    // giant snakehead: Jun - Aug in the north.
    expect(monthsTextIn(find('giant snakehead').north, 'es')).toEqual(['jun - ago']);
  });

  it('renders year-round as ene - dic', () => {
    expect(monthsTextIn(find('coelacanth').north, 'es')).toEqual(['ene - dic']);
  });

  /**
   * Split seasons must stay split. Merging Jan–Mar with Nov–Dec into "nov - mar" would claim
   * the critter is catchable in months it is absent — a confident wrong answer.
   */
  it('keeps split seasons separate rather than merging across the year boundary', () => {
    const bitterling = find('bitterling');
    expect(bitterling.north.monthsText).toEqual(['Jan - Mar', 'Nov - Dec']);
    expect(monthsTextIn(bitterling.north, 'es')).toEqual(['ene - mar', 'nov - dic']);
  });

  it('renders a single-month window without a range dash', () => {
    const single = CRITTERS.find((c) => c.north.monthsText.length === 1 && c.north.months.length === 1);
    if (single) {
      expect(monthsTextIn(single.north, 'es')[0]).not.toContain(' - ');
    }
  });

  it('produces the same number of windows as upstream, for every critter', () => {
    for (const c of CRITTERS) {
      for (const hemi of ['north', 'south'] as const) {
        expect(monthsTextIn(c[hemi], 'es').length, `${c.id} ${hemi}`).toBe(
          c[hemi].monthsText.length,
        );
      }
    }
  });
});
