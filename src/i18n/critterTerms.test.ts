import { describe, expect, it } from 'vitest';

import { CRITTERS } from '../data/critters.ts';
import { LANGS } from './lang.ts';
import {
  shadowLabel,
  speedLabel,
  weatherLabel,
  whereGroupLabel,
  whereHowLabel,
} from './critterTerms.ts';

const distinct = <T,>(values: Iterable<T>): T[] => [...new Set(values)];

describe('critter attribute translations', () => {
  /*
    The important guarantee: every value that actually appears in the dataset has Spanish.
    A missing key falls back to English, which renders a lone English chip in a Spanish UI —
    subtle enough to ship unnoticed, so it is asserted rather than eyeballed.
  */
  it('translates every whereHow value present in the dataset', () => {
    const values = distinct(CRITTERS.map((c) => c.whereHow).filter((v): v is string => !!v));
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) {
      expect(whereHowLabel(v, 'es'), `untranslated whereHow: ${v}`).not.toBe(v);
    }
  });

  it('translates every shadow value present in the dataset', () => {
    const values = distinct(CRITTERS.map((c) => c.shadow).filter((v) => !!v));
    for (const v of values) {
      expect(shadowLabel(v!, 'es'), `untranslated shadow: ${v}`).not.toBe(v);
    }
  });

  it('translates every movement speed present in the dataset', () => {
    const values = distinct(CRITTERS.map((c) => c.movementSpeed).filter((v) => !!v));
    for (const v of values) {
      expect(speedLabel(v!, 'es'), `untranslated speed: ${v}`).not.toBe(v);
    }
  });

  it('translates every weather value present in the dataset', () => {
    const values = distinct(CRITTERS.map((c) => c.weather).filter((v) => !!v));
    for (const v of values) {
      expect(weatherLabel(v!, 'es'), `untranslated weather: ${v}`).not.toBe(v);
    }
  });

  it('translates every whereGroup present in the dataset', () => {
    const values = distinct(CRITTERS.map((c) => c.whereGroup).filter((v) => !!v));
    for (const v of values) {
      expect(whereGroupLabel(v!, 'es'), `untranslated whereGroup: ${v}`).not.toBe(v);
    }
  });

  it('returns the English value unchanged in English mode', () => {
    expect(whereHowLabel('On flowers', 'en')).toBe('On flowers');
    expect(shadowLabel('X-Large', 'en')).toBe('X-Large');
    expect(weatherLabel('Rain only', 'en')).toBe('Rain only');
  });

  it('falls back to the input rather than blank for an unknown value', () => {
    // Degrading to readable English beats an empty chip that looks like missing data.
    expect(whereHowLabel('On the moon', 'es')).toBe('On the moon');
  });

  it('never returns an empty label for any dataset value in any language', () => {
    for (const { id } of LANGS) {
      for (const c of CRITTERS) {
        if (c.whereHow) expect(whereHowLabel(c.whereHow, id)).toBeTruthy();
        if (c.shadow) expect(shadowLabel(c.shadow, id)).toBeTruthy();
        if (c.movementSpeed) expect(speedLabel(c.movementSpeed, id)).toBeTruthy();
        if (c.weather) expect(weatherLabel(c.weather, id)).toBeTruthy();
        if (c.whereGroup) expect(whereGroupLabel(c.whereGroup, id)).toBeTruthy();
      }
    }
  });
});
