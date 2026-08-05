/**
 * The availability engine — the heart of the app, and the only part that must not be wrong.
 *
 * Every function takes an explicit `now: Date`. Nothing here reads the clock, which is what
 * makes the whole engine testable without mocking and lets the UI offer a time-override for
 * players who time-travel (ACNH follows the console clock, not ours).
 */

import type { Availability, Critter, Hemisphere } from '../data/types.ts';

export const windowFor = (c: Critter, hemi: Hemisphere): Availability =>
  hemi === 'north' ? c.north : c.south;

/**
 * Empty means "unconstrained". The real dataset has no empty arrays — year-round is a full
 * 12-length month array and all-day is a full 24-length hour array — so this is a defensive
 * fallback, not the working mechanism.
 */
const inSet = (set: number[], v: number): boolean =>
  set.length === 0 || set.includes(v);

/** 1-12, matching the dataset's month encoding (not JS's 0-11). */
export const monthOf = (now: Date): number => now.getMonth() + 1;

export const isAvailableInMonth = (
  c: Critter,
  month: number,
  hemi: Hemisphere,
): boolean => inSet(windowFor(c, hemi).months, month);

export const isAvailableAtHour = (
  c: Critter,
  hour: number,
  hemi: Hemisphere,
): boolean => inSet(windowFor(c, hemi).hours, hour);

/**
 * Catchable at this exact moment. Midnight-spanning windows arrive pre-expanded
 * (e.g. [21,22,23,0,1,2,3]), so plain membership is correct and no wraparound
 * arithmetic is needed.
 */
export const isAvailableNow = (
  c: Critter,
  now: Date,
  hemi: Hemisphere,
): boolean =>
  isAvailableInMonth(c, monthOf(now), hemi) &&
  isAvailableAtHour(c, now.getHours(), hemi);

export const isYearRound = (c: Critter, hemi: Hemisphere): boolean =>
  windowFor(c, hemi).months.length >= 12;

export const isAllDay = (c: Critter, hemi: Hemisphere): boolean =>
  windowFor(c, hemi).hours.length >= 24;

const nextMonth = (m: number): number => (m === 12 ? 1 : m + 1);
const prevMonth = (m: number): number => (m === 1 ? 12 : m - 1);

/**
 * Available this month but not next — i.e. this is the last chance for a while.
 * The year-round guard is load-bearing: without it all 38 year-round critters would
 * be flagged as leaving, every single month.
 */
export const isLeavingAfterThisMonth = (
  c: Critter,
  now: Date,
  hemi: Hemisphere,
): boolean => {
  const { months } = windowFor(c, hemi);
  if (months.length === 0 || months.length >= 12) return false;
  const m = monthOf(now);
  return months.includes(m) && !months.includes(nextMonth(m));
};

/** Not available this month but available next — a "get ready" signal, not a "hurry" one. */
export const isArrivingNextMonth = (
  c: Critter,
  now: Date,
  hemi: Hemisphere,
): boolean => {
  const { months } = windowFor(c, hemi);
  if (months.length === 0 || months.length >= 12) return false;
  const m = monthOf(now);
  return !months.includes(m) && months.includes(nextMonth(m));
};

/** First month of the current run — used to say "new this month". */
export const isNewThisMonth = (
  c: Critter,
  now: Date,
  hemi: Hemisphere,
): boolean => {
  const { months } = windowFor(c, hemi);
  if (months.length === 0 || months.length >= 12) return false;
  const m = monthOf(now);
  return months.includes(m) && !months.includes(prevMonth(m));
};

/**
 * Hours remaining in the current contiguous run, counting the current hour.
 * Returns 0 when not currently available, and null when available all day (nothing
 * to warn about). Walks forward mod 24, so a window like [21,22,23,0,1,2,3] is
 * measured across midnight correctly.
 */
export const hoursUntilGone = (
  c: Critter,
  now: Date,
  hemi: Hemisphere,
): number | null => {
  if (!isAvailableNow(c, now, hemi)) return 0;
  if (isAllDay(c, hemi)) return null;

  const { hours } = windowFor(c, hemi);
  const set = new Set(hours);
  let count = 0;
  for (let i = 0; i < 24; i++) {
    if (!set.has((now.getHours() + i) % 24)) break;
    count++;
  }
  return count;
};

export const availableNow = (
  critters: readonly Critter[],
  now: Date,
  hemi: Hemisphere,
): Critter[] => critters.filter((c) => isAvailableNow(c, now, hemi));
