import { describe, expect, it } from 'vitest';

import { LANGS } from './lang.ts';
import { messagesFor } from './messages.ts';

describe('message catalog', () => {
  /*
    `Record<Lang, Messages>` already makes a missing key a type error. This catches the
    thing types cannot: a key present but left as an empty string.
  */
  it('has a non-empty value for every key in every language', () => {
    for (const { id } of LANGS) {
      const t = messagesFor(id);
      for (const [key, value] of Object.entries(t)) {
        if (typeof value === 'string') {
          expect(value.trim(), `${id}.${key} is blank`).not.toBe('');
        }
      }
    }
  });

  it('has the same key set in both languages', () => {
    const en = Object.keys(messagesFor('en')).sort();
    const es = Object.keys(messagesFor('es')).sort();
    expect(es).toEqual(en);
  });

  it('actually differs between languages (not a copy-paste of English)', () => {
    const en = messagesFor('en');
    const es = messagesFor('es');
    const strings = Object.keys(en).filter(
      (k) => typeof en[k as keyof typeof en] === 'string',
    );
    const identical = strings.filter(
      (k) => en[k as keyof typeof en] === es[k as keyof typeof es],
    );
    // 'Coral' is legitimately the same word in both; anything more suggests a missed key.
    expect(identical).toEqual(['themeCoral']);
  });

  it('pluralizes the Spanish critter count', () => {
    const es = messagesFor('es');
    expect(es.critterCountSuffix(1, false)).toBe('criatura');
    expect(es.critterCountSuffix(2, false)).toBe('criaturas');
    expect(es.critterCountSuffix(0, false)).toBe('criaturas');
  });

  it('marks a filtered result set in both languages', () => {
    expect(messagesFor('en').critterCountSuffix(5, true)).toContain('(filtered)');
    expect(messagesFor('es').critterCountSuffix(5, true)).toContain('(filtrado)');
  });

  it('agrees in number for the "catchable now" phrasing in Spanish', () => {
    const es = messagesFor('es');
    expect(es.catchableNowSuffix(1, false)).toContain('disponible');
    expect(es.catchableNowSuffix(3, false)).toContain('disponibles');
  });
});
