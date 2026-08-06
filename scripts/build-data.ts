/**
 * Vendors ACNH critter data at build time into a slim, typed, offline-ready dataset.
 *
 * Two of this ecosystem's main data APIs (acnhapi.com, nook.plus) are already dead, so
 * the app must never depend on a live third-party API. We fetch once, normalize, validate
 * hard, and commit the result.
 *
 * Run: npm run build:data
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  Availability,
  Critter,
  CritterDataset,
  Kind,
  WhereGroup,
} from '../src/data/types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'src', 'data', 'critters.generated.json');

const SOURCE_REPO = 'Norviah/animal-crossing';
const BASE =
  'https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data';

const SOURCES: ReadonlyArray<{ file: string; kind: Kind; expected: number }> = [
  { file: 'Fish.json', kind: 'fish', expected: 80 },
  { file: 'Insects.json', kind: 'bug', expected: 80 },
  { file: 'Sea Creatures.json', kind: 'sea', expected: 40 },
];

/**
 * Bug `whereHow` is 25 free-text strings. An explicit map (not a regex) because a
 * mis-bucketed critter is silently unfindable, and 25 is small enough to enumerate.
 * A new upstream string fails the build rather than falling into a default bucket.
 */
const BUG_LOCATION_GROUPS: Readonly<Record<string, WhereGroup>> = {
  'On trees (any kind)': 'Trees',
  'On hardwood/cedar trees': 'Trees',
  'On palm trees': 'Trees',
  'On tree stumps': 'Trees',
  'Shaking trees': 'Trees',
  'Shaking trees (hardwood or cedar only)': 'Trees',
  'Disguised under trees': 'Trees',

  'On flowers': 'Flowers',
  'On white flowers': 'Flowers',
  'Flying near flowers': 'Flowers',
  'Flying near blue/purple/black flowers': 'Flowers',

  'On the ground': 'Ground',
  'Underground (dig where noise is loudest)': 'Ground',
  'On rocks/bushes': 'Ground',
  'On beach rocks': 'Ground',
  'From hitting rocks': 'Ground',
  'Disguised on shoreline': 'Ground',

  Flying: 'Flying',
  'Flying near light sources': 'Flying',

  'On rivers/ponds': 'Water',
  'Flying near water': 'Water',

  'On villagers': 'Special',
  'Pushing snowballs': 'Special',
  'On rotten turnips or candy': 'Special',
  'Flying near trash (boots, tires, cans, used fountain fireworks) or rotten turnips':
    'Special',
};

/**
 * Critters whose Spanish name is legitimately identical to the English — loanwords and
 * cognates (`dorado` is itself Spanish). Enumerated so that the "ES must differ from EN"
 * check can catch a wrong-key regression without these 6 tripping it.
 */
const SHARED_NAMES: ReadonlySet<string> = new Set([
  'arowana',
  'betta',
  'dorado',
  'koi',
  'tilapia',
  'mosquito',
]);

/**
 * Mexican-Spanish spot checks. These 4 are exactly where `uSes` and `eUes` disagree, so
 * they are the canary for the field selection: if a future upstream reshuffle points this
 * build at peninsular Spanish, `mariquita` lands here and the build stops.
 */
const ES_PINS: Readonly<Record<string, string>> = {
  ladybug: 'catarina',
  'evening cicada': 'cigarra',
  'cicada shell': 'carcasa de cigarra',
  'paper kite butterfly': 'mariposa papel de arroz',
};

/** Upstream shape — only the fields we consume. */
interface RawHemisphere {
  time: string[];
  timeArray: number[] | number[][];
  months: string[];
  monthsArray: number[] | number[][];
}

/**
 * Upstream ships 14 locales per critter. We keep exactly one: `uSes`, the Americas
 * Spanish localization, which is the Mexican wording the game itself ships.
 *
 * `uSes` and `eUes` are NOT interchangeable. They agree for 196 of 200 critters and
 * diverge for 4, always in the direction of Mexican vs. peninsular vocabulary:
 *
 *   ladybug              catarina             / mariquita
 *   evening cicada       cigarra              / cigarrilla
 *   cicada shell         carcasa de cigarra   / muda de cigarra
 *   paper kite butterfly mariposa papel de arroz / mariposa cometa de papel
 *
 * A 98%-correct field is the worst kind of bug here: it looks right in spot checks and
 * is wrong precisely where a Mexican player would notice. Hence `uSes`, asserted below.
 */
interface RawTranslations {
  uSes?: string | null;
  eUes?: string | null;
}

interface RawCritter {
  name: string;
  num: number;
  sell: number;
  shadow?: string | null;
  movementSpeed?: string | null;
  whereHow?: string | null;
  weather?: string | null;
  catchDifficulty?: string | null;
  vision?: string | null;
  iconFilename: string;
  translations?: RawTranslations | null;
  hemispheres: { north: RawHemisphere; south: RawHemisphere };
}

const fail = (msg: string): never => {
  throw new Error(`[build-data] ${msg}`);
};

/**
 * Flattens the nested per-window arrays that 8 entries ship (piranha, evening cicada,
 * walking stick, giant isopod — both hemispheres each). A naive `.includes(hour)` on
 * those returns false, silently hiding exactly the rare critters completionists hunt.
 */
const flattenWindows = (a: number[] | number[][] | null | undefined): number[] => {
  if (!Array.isArray(a) || a.length === 0) return [];
  return Array.isArray(a[0]) ? (a as number[][]).flat() : (a as number[]);
};

/** Upstream display strings contain non-breaking spaces, which break text search. */
const cleanText = (s: string): string => s.replace(/ /g, ' ').trim();

const toAvailability = (h: RawHemisphere): Availability => ({
  months: flattenWindows(h.monthsArray),
  hours: flattenWindows(h.timeArray),
  monthsText: (h.months ?? []).map(cleanText),
  hoursText: (h.time ?? []).map(cleanText),
});

async function fetchJson<T>(file: string): Promise<T> {
  const url = `${BASE}/${encodeURIComponent(file)}`;
  const res = await fetch(url);
  if (!res.ok) fail(`GET ${url} -> ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

function toCritter(raw: RawCritter, kind: Kind): Critter {
  /*
    Hard-fail on a missing Spanish name rather than falling back to English. A silent
    fallback would ship a dataset that is 199/200 Spanish, and the one English straggler
    would look like a translation gap in the game rather than a broken build.
  */
  const nameEs = raw.translations?.uSes;
  if (!nameEs) return fail(`Missing translations.uSes for "${raw.name}" (${kind}-${raw.num})`);

  const c: Critter = {
    id: `${kind}-${raw.num}`,
    kind,
    name: raw.name,
    nameEs: cleanText(nameEs),
    num: raw.num,
    sell: raw.sell,
    icon: raw.iconFilename,
    north: toAvailability(raw.hemispheres.north),
    south: toAvailability(raw.hemispheres.south),
  };

  // Only attach fields that genuinely exist for this kind. Bugs cast no shadow;
  // sea creatures have no location; only sea creatures have a movement speed.
  if (raw.shadow) c.shadow = raw.shadow as Critter['shadow'];
  if (raw.movementSpeed) c.movementSpeed = raw.movementSpeed as Critter['movementSpeed'];
  if (raw.catchDifficulty) c.catchDifficulty = raw.catchDifficulty;
  if (raw.vision) c.vision = raw.vision;
  if (raw.weather) c.weather = raw.weather as Critter['weather'];

  if (raw.whereHow) {
    c.whereHow = cleanText(raw.whereHow);
    if (kind === 'bug') {
      const group = BUG_LOCATION_GROUPS[c.whereHow];
      if (!group) {
        fail(
          `Unmapped bug location ${JSON.stringify(c.whereHow)} on "${raw.name}". ` +
            `Add it to BUG_LOCATION_GROUPS.`,
        );
      }
      c.whereGroup = group;
    }
  }

  return c;
}

/**
 * Fails the build on any invariant violation. All of these pass against the data as of
 * 2026-08-04; the point is to break loudly the day upstream changes shape, rather than
 * silently dropping critters from results.
 */
function validate(critters: Critter[]): void {
  const seen = new Set<string>();

  for (const c of critters) {
    if (seen.has(c.id)) fail(`Duplicate id ${c.id}`);
    seen.add(c.id);

    if (!c.name) fail(`Missing name on ${c.id}`);
    if (!c.nameEs) fail(`Missing Spanish name on ${c.id}`);
    if (c.nameEs === c.name && !SHARED_NAMES.has(c.name.toLowerCase())) {
      fail(
        `${c.id}: Spanish name identical to English ("${c.name}") — ` +
          `wrong translations key, or add it to SHARED_NAMES if genuinely untranslated.`,
      );
    }
    if (!c.icon) fail(`Missing icon on ${c.id}`);
    if (!Number.isFinite(c.sell)) fail(`Bad sell price on ${c.id}`);

    for (const hemi of ['north', 'south'] as const) {
      const { months, hours, monthsText, hoursText } = c[hemi];

      if (months.length === 0) fail(`${c.id} ${hemi}: empty months array`);
      if (hours.length === 0) fail(`${c.id} ${hemi}: empty hours array`);
      if (monthsText.length === 0) fail(`${c.id} ${hemi}: missing months display text`);
      if (hoursText.length === 0) fail(`${c.id} ${hemi}: missing hours display text`);

      for (const m of months) {
        if (!Number.isInteger(m) || m < 1 || m > 12) {
          fail(`${c.id} ${hemi}: month out of range (${m}) — nested array not flattened?`);
        }
      }
      for (const h of hours) {
        if (!Number.isInteger(h) || h < 0 || h > 23) {
          fail(`${c.id} ${hemi}: hour out of range (${h}) — nested array not flattened?`);
        }
      }
      if (new Set(months).size !== months.length) fail(`${c.id} ${hemi}: duplicate months`);
      if (new Set(hours).size !== hours.length) fail(`${c.id} ${hemi}: duplicate hours`);
    }

    const pin = ES_PINS[c.name.toLowerCase()];
    if (pin && c.nameEs !== pin) {
      fail(
        `${c.id} "${c.name}": expected Mexican Spanish "${pin}", got "${c.nameEs}". ` +
          `This is the uSes-vs-eUes canary — verify the translations key.`,
      );
    }

    if (c.kind === 'bug' && c.shadow) fail(`${c.id}: bugs must not have a shadow`);
    if (c.kind === 'bug' && !c.whereGroup) fail(`${c.id}: bug missing whereGroup`);
    if (c.kind === 'sea' && !c.movementSpeed) fail(`${c.id}: sea creature missing speed`);
  }
}

async function main(): Promise<void> {
  const critters: Critter[] = [];

  for (const { file, kind, expected } of SOURCES) {
    const raw = await fetchJson<RawCritter[]>(file);
    if (raw.length !== expected) {
      fail(`${file}: expected ${expected} entries, got ${raw.length}`);
    }
    for (const entry of raw) critters.push(toCritter(entry, kind));
    console.log(`  ${kind.padEnd(4)} ${raw.length} entries`);
  }

  validate(critters);

  const dataset: CritterDataset = {
    dataVersion: '1',
    generatedFrom: SOURCE_REPO,
    critters,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  const json = JSON.stringify(dataset);
  writeFileSync(OUT, json);

  console.log(
    `\n  ${critters.length} critters -> ${OUT}\n` +
      `  ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB raw\n`,
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
