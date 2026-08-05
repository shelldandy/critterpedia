/**
 * The dataset, bundled into the app at build time. No fetch, no loading state, works offline.
 * Regenerate with `npm run build:data`.
 */

import raw from './critters.generated.json';
import type { Critter, CritterDataset } from './types.ts';

const dataset = raw as unknown as CritterDataset;

export const CRITTERS: readonly Critter[] = dataset.critters;
export const DATA_VERSION = dataset.dataVersion;

export const byId = new Map<string, Critter>(CRITTERS.map((c) => [c.id, c]));

/** Images live on a third-party CDN; keeping this a single function means a dead CDN is a one-line fix. */
const CDN = 'https://acnhcdn.com/latest';

/** ~15KB — safe for grids and lists. */
export const iconUrl = (c: Critter): string => `${CDN}/MenuIcon/${c.icon}.png`;
