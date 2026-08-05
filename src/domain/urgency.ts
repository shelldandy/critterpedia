/**
 * Urgency ranking — turns "what's available" into "what should I chase first".
 *
 * The ordering principle: irreversibility. A critter you lose at midnight outranks one
 * you lose at month end, which outranks one that is always around.
 */

import type { Critter, Hemisphere } from '../data/types.ts';
import {
  hoursUntilGone,
  isAllDay,
  isAvailableNow,
  isLeavingAfterThisMonth,
  isNewThisMonth,
  isYearRound,
  windowFor,
} from './availability.ts';

/** Warn about the daily window closing only when it is actually close. */
export const LEAVING_SOON_HOURS = 3;

export interface Urgency {
  critter: Critter;
  /** Last month of this run. */
  leavingThisMonth: boolean;
  /** First month of this run — worth surfacing while it is still fresh. */
  newThisMonth: boolean;
  /** Hours left in the current daily window; null when available all day. */
  hoursLeft: number | null;
  /** Daily window closing within LEAVING_SOON_HOURS. */
  closingSoon: boolean;
  /** How many months of the year this critter is available — narrower is rarer. */
  monthsAvailable: number;
  /** How many hours of the day this critter is available — narrower is rarer. */
  hoursAvailable: number;
}

export const urgencyOf = (
  c: Critter,
  now: Date,
  hemi: Hemisphere,
): Urgency => {
  const w = windowFor(c, hemi);
  const hoursLeft = hoursUntilGone(c, now, hemi);
  return {
    critter: c,
    leavingThisMonth: isLeavingAfterThisMonth(c, now, hemi),
    newThisMonth: isNewThisMonth(c, now, hemi),
    hoursLeft,
    closingSoon: hoursLeft !== null && hoursLeft > 0 && hoursLeft <= LEAVING_SOON_HOURS,
    monthsAvailable: isYearRound(c, hemi) ? 12 : w.months.length,
    hoursAvailable: isAllDay(c, hemi) ? 24 : w.hours.length,
  };
};

/**
 * Most-urgent first. Ties break toward the rarer critter, then the more valuable one,
 * so a grinder's limited time goes to the entries hardest to get back.
 */
export const compareUrgency = (a: Urgency, b: Urgency): number =>
  Number(b.closingSoon) - Number(a.closingSoon) ||
  Number(b.leavingThisMonth) - Number(a.leavingThisMonth) ||
  (a.hoursLeft ?? 99) - (b.hoursLeft ?? 99) ||
  a.monthsAvailable - b.monthsAvailable ||
  a.hoursAvailable - b.hoursAvailable ||
  b.critter.sell - a.critter.sell ||
  a.critter.name.localeCompare(b.critter.name);

/** Everything catchable at this exact moment, most urgent first. */
export const rankCatchableNow = (
  critters: readonly Critter[],
  now: Date,
  hemi: Hemisphere,
): Urgency[] =>
  critters
    .filter((c) => isAvailableNow(c, now, hemi))
    .map((c) => urgencyOf(c, now, hemi))
    .sort(compareUrgency);

export type UrgencyBand = 'closing' | 'leaving' | 'new' | 'rest';

export const bandOf = (u: Urgency): UrgencyBand => {
  if (u.closingSoon) return 'closing';
  if (u.leavingThisMonth) return 'leaving';
  if (u.newThisMonth) return 'new';
  return 'rest';
};

export const BAND_LABELS: Record<UrgencyBand, string> = {
  closing: 'Leaving within hours',
  leaving: 'Last month to catch',
  new: 'New this month',
  rest: 'Also available now',
};

export const BAND_ORDER: readonly UrgencyBand[] = ['closing', 'leaving', 'new', 'rest'];

export const groupByBand = (items: readonly Urgency[]): Map<UrgencyBand, Urgency[]> => {
  const out = new Map<UrgencyBand, Urgency[]>();
  for (const band of BAND_ORDER) out.set(band, []);
  for (const u of items) out.get(bandOf(u))?.push(u);
  return out;
};
