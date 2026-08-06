import { describe, expect, it } from 'vitest';

import { CRITTERS } from '../data/critters.ts';
import { DEFAULT_LANG, LANGS, isLang, nameIn } from './lang.ts';

const byName = (name: string) => {
  const c = CRITTERS.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (!c) throw new Error(`No critter named ${name}`);
  return c;
};

describe('Spanish critter names', () => {
  it('ships a non-empty Spanish name for all 200 critters', () => {
    expect(CRITTERS).toHaveLength(200);
    for (const c of CRITTERS) {
      expect(c.nameEs, `${c.id} (${c.name})`).toBeTruthy();
      expect(c.nameEs.trim()).toBe(c.nameEs);
    }
  });

  /**
   * The whole point of choosing `uSes` over `eUes`. These 4 are the only critters where the
   * two Spanish localizations disagree, so they are the regression test for the field choice
   * — `mariquita` appearing here means the build picked up peninsular Spanish.
   */
  it.each([
    ['ladybug', 'catarina', 'mariquita'],
    ['evening cicada', 'cigarra', 'cigarrilla'],
    ['cicada shell', 'carcasa de cigarra', 'muda de cigarra'],
    ['paper kite butterfly', 'mariposa papel de arroz', 'mariposa cometa de papel'],
  ])('uses Mexican Spanish for %s: %s, not %s', (en, mx, peninsular) => {
    const c = byName(en);
    expect(c.nameEs).toBe(mx);
    expect(c.nameEs).not.toBe(peninsular);
  });

  it('keeps accents rather than stripping them', () => {
    // A build that mangled encoding would leave "pez napoleon" or "pez napole??n".
    expect(byName('Napoleonfish').nameEs).toBe('pez napoleón');
    expect(CRITTERS.some((c) => /[áéíóúñ]/.test(c.nameEs))).toBe(true);
  });

  it('has no non-breaking spaces left in Spanish names', () => {
    for (const c of CRITTERS) expect(c.nameEs).not.toMatch(/ /);
  });
});

describe('nameIn', () => {
  it('returns the English name for en and the Spanish name for es', () => {
    const ladybug = byName('ladybug');
    expect(nameIn(ladybug, 'en')).toBe('ladybug');
    expect(nameIn(ladybug, 'es')).toBe('catarina');
  });

  it('resolves to a non-empty string for every critter in every language', () => {
    for (const { id } of LANGS) {
      for (const c of CRITTERS) expect(nameIn(c, id)).toBeTruthy();
    }
  });
});

describe('isLang', () => {
  it('accepts the known ids and rejects anything else', () => {
    expect(isLang('en')).toBe(true);
    expect(isLang('es')).toBe(true);
    // `es-MX` is deliberately not an id — the store must coerce it, not persist it.
    expect(isLang('es-MX')).toBe(false);
    expect(isLang('fr')).toBe(false);
    expect(isLang(undefined)).toBe(false);
    expect(isLang(null)).toBe(false);
    expect(isLang(2)).toBe(false);
  });

  it('defaults to English', () => {
    expect(DEFAULT_LANG).toBe('en');
    expect(isLang(DEFAULT_LANG)).toBe(true);
  });
});
