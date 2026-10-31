/**
 * Lint-as-a-test: fails when a component gains user-facing English text that does not come
 * from the message catalog.
 *
 * This is a test rather than an ESLint rule on purpose. The repo has no linter, and pulling
 * in ESLint + the TS/React plugin chain to enforce one project-specific rule would add far
 * more dependency surface than the rule is worth. `vitest` already runs in CI, and a custom
 * ESLint rule would need roughly this same source-scanning logic anyway.
 *
 * It caught the real thing it was written for: a "Clear filters" button that stayed English
 * through a full manual pass because it only renders when a filter is active.
 *
 * The check is deliberately source-text based (no parser dependency), so it is heuristic. It
 * errs toward false positives and offers ALLOWED_* escape hatches, since a noisy failure is
 * cheap to whitelist while a missed string ships a half-translated UI.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(p);
    return e.isFile() && /\.tsx$/.test(e.name) && !e.name.includes('.test.') ? [p] : [];
  });

/** Strips comments and `className`/`style` values, which are full of English-looking words. */
const stripNoise = (src: string): string =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/className=\{?`[\s\S]*?`\}?/g, 'className=""')
    .replace(/className="[^"]*"/g, 'className=""')
    .replace(/className=\{[^}]*\}/g, 'className=""');

/*
  Text that is legitimately not translated:
  - the LangPicker is self-labelling in both languages by design
  - `Norviah/animal-crossing` is a proper noun (a repo name)
  - single glyphs and separators carry no language
*/
const ALLOWED_TEXT = new Set([
  'Norviah/animal-crossing',
  'Critter name language / Idioma de los nombres',
  'EN',
  'ES',
]);

const isAllowed = (text: string): boolean => {
  const t = text.trim();
  if (t === '' || ALLOWED_TEXT.has(t)) return true;
  // Punctuation, glyphs, digits and single letters are language-neutral.
  if (!/[A-Za-z]{2}/.test(t)) return true;
  return false;
};

/*
  A `>text<` regex cannot distinguish JSX text from TypeScript generics (`Set<T>`,
  `Record<string, string>`) or comparisons, and those produced every false positive on the
  first run. Rather than parse TSX, require the candidate to look like display prose:
  words and ordinary sentence punctuation only. Code fragments carry `=`, `;`, `:`, `(`,
  quotes or newlines, so they are excluded.
*/
const looksLikeProse = (text: string): boolean => {
  const t = text.trim();
  if (t.includes('\n')) return false;
  if (/[=;:(){}[\]'"`|&<>/\\]/.test(t)) return false;
  return /^[A-Za-z][A-Za-z0-9 .,!?…&%°–—'-]*$/.test(t);
};

describe('no hardcoded user-facing strings in components', () => {
  const files = sourceFiles(SRC);

  it('finds component files to scan', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  /**
   * JSX text nodes: `>Some text<`. Anything with two consecutive letters that is not an
   * expression must have come from a literal rather than from the catalog.
   */
  it('has no literal text between JSX tags', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const src = stripNoise(readFileSync(file, 'utf8'));
      for (const m of src.matchAll(/>([^<>{}]+)</g)) {
        const text = m[1]!;
        if (!isAllowed(text) && looksLikeProse(text)) {
          offenders.push(`${file.replace(SRC, 'src')}: ${JSON.stringify(text.trim())}`);
        }
      }
    }

    expect(offenders, `Move these into src/i18n/messages.ts:\n${offenders.join('\n')}`).toEqual(
      [],
    );
  });

  /**
   * User-visible string props. `aria-label`, `title` and `placeholder` are read aloud or
   * shown on hover, so an English literal there is just as untranslated as visible text.
   */
  it('has no literal aria-label, title, or placeholder', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const src = stripNoise(readFileSync(file, 'utf8'));
      for (const m of src.matchAll(/(aria-label|title|placeholder)="([^"]+)"/g)) {
        const [, prop, value] = m;
        if (!isAllowed(value!)) {
          offenders.push(`${file.replace(SRC, 'src')}: ${prop}=${JSON.stringify(value)}`);
        }
      }
    }

    expect(
      offenders,
      `Use a catalog key instead:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  /**
   * Label-ish object/array literals (`label: 'Fish'`) — the shape the kind and scope lists
   * originally used, where the English sat in a const far from the JSX.
   */
  it('has no label-like string literals in component constants', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const src = stripNoise(readFileSync(file, 'utf8'));
      for (const m of src.matchAll(/\b(label|text|heading|title)\s*:\s*'([^']+)'/g)) {
        const [, key, value] = m;
        if (!isAllowed(value!)) {
          offenders.push(`${file.replace(SRC, 'src')}: ${key}: ${JSON.stringify(value)}`);
        }
      }
    }

    expect(offenders, `Move these into the catalog:\n${offenders.join('\n')}`).toEqual([]);
  });
});
