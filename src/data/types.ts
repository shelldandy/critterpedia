/** Shared domain types. Kept free of React and of any I/O. */

export type Hemisphere = 'north' | 'south';
export type Kind = 'fish' | 'bug' | 'sea';

/**
 * Fish shadow sizes. NOTE: `Long` and `X-Large w/Fin` describe *shape*, not size —
 * they must not be placed inside a small→large ramp in the UI.
 */
export type FishShadow =
  | 'X-Small'
  | 'Small'
  | 'Medium'
  | 'Large'
  | 'X-Large'
  | 'X-Large w/Fin'
  | 'XX-Large'
  | 'Long';

/** Sea creature shadow sizes — a strict subset of the fish ramp, all true sizes. */
export type SeaShadow = 'X-Small' | 'Small' | 'Medium' | 'Large' | 'X-Large';

export type Shadow = FishShadow | SeaShadow;

/** Sea creatures only. Bugs and fish have no movement speed. */
export type MovementSpeed =
  | 'Stationary'
  | 'Very slow'
  | 'Slow'
  | 'Medium'
  | 'Fast'
  | 'Very fast';

/** Bugs only. */
export type Weather = 'Any weather' | 'Any except rain' | 'Rain only';

/** Bucketed bug locations. The raw `whereHow` string is kept for display. */
export type WhereGroup =
  | 'Trees'
  | 'Flowers'
  | 'Ground'
  | 'Flying'
  | 'Water'
  | 'Special';

/**
 * One hemisphere's availability.
 *
 * `months` / `hours` are flat, normalized integer arrays — use these and ONLY these
 * for logic. Midnight-spanning windows arrive pre-expanded (e.g. [21,22,23,0,1,2,3]),
 * so membership testing is sufficient and no wraparound arithmetic is needed.
 *
 * `monthsText` / `hoursText` are the upstream human-formatted strings — use these and
 * ONLY these for display. Reconstructing a range from the arrays via min/max renders
 * a midnight-spanning window as "0:00-23:00" (i.e. "all day"), which is wrong for
 * 23 of 80 fish.
 */
export interface Availability {
  months: number[];
  hours: number[];
  monthsText: string[];
  hoursText: string[];
}

export interface Critter {
  /** `${kind}-${num}`. `num` is unique 1..N within each kind. */
  id: string;
  kind: Kind;
  /**
   * English (US) name. Stays the canonical key: ids, tests, and the `SHARED_NAMES` /
   * `ES_PINS` build checks all key off this, never off a localized name.
   */
  name: string;
  /**
   * Americas (Mexican) Spanish name, from upstream `translations.uSes` — NOT `eUes`,
   * which is peninsular and differs for 4 critters (ladybug is `catarina`, not
   * `mariquita`). See the note in `scripts/build-data.ts`.
   */
  nameEs: string;
  num: number;
  /** Sell price to Nooks. */
  sell: number;
  /** Fish and sea creatures only — bugs cast no shadow. */
  shadow?: Shadow;
  /** Sea creatures only. */
  movementSpeed?: MovementSpeed;
  /** Fish and bugs only — sea creatures are all dive-caught, so upstream leaves this null. */
  whereHow?: string;
  /** Bugs only: `whereHow` bucketed for filtering. */
  whereGroup?: WhereGroup;
  /** Bugs only. */
  weather?: Weather;
  catchDifficulty?: string;
  /** Skittishness — how easily the critter flees. */
  vision?: string;
  /** Image filename stem (e.g. "Fish43"), never a full URL. See imageUrl(). */
  icon: string;
  north: Availability;
  south: Availability;
}

export interface CritterDataset {
  dataVersion: string;
  generatedFrom: string;
  critters: Critter[];
}
