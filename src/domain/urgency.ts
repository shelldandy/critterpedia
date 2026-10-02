/**
 * Urgency ranking — turns "what's available" into "what should I chase first".
 *
 * The ordering principle: irreversibility. A critter you lose at midnight outranks one
 * you lose at month end, which outranks one that is always around.
 */

import type { Critter, Hemisphere } from '../data/types.ts';
import { localeOf, nameIn, type Lang } from '../i18n/lang.ts';
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
 *
 * The final name tiebreak follows the display language so the visible order matches the
 * visible names; it defaults to English, keeping this callable as a bare comparator.
 */
export const compareUrgencyIn = (lang: Lang) => {
  // One collator per sort, not per comparison — this is the default sort, so it runs on
  // every render. `Intl.Collator` also orders "ñ" and accented vowels correctly in Spanish,
  // which codepoint comparison does not.
  const collator = new Intl.Collator(localeOf(lang), {
    sensitivity: 'variant',
    numeric: true,
  });
  return (a: Urgency, b: Urgency): number =>
    Number(b.closingSoon) - Number(a.closingSoon) ||
    Number(b.leavingThisMonth) - Number(a.leavingThisMonth) ||
    (a.hoursLeft ?? 99) - (b.hoursLeft ?? 99) ||
    a.monthsAvailable - b.monthsAvailable ||
    a.hoursAvailable - b.hoursAvailable ||
    b.critter.sell - a.critter.sell ||
    collator.compare(nameIn(a.critter, lang), nameIn(b.critter, lang));
};

export const compareUrgency = compareUrgencyIn('en');

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
