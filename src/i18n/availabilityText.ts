/**
 * Localized month/hour window text.
 *
 * The upstream `monthsText`/`hoursText` strings are English-only ("Mar - Oct", "4 PM – 9 AM"),
 * and there is no translated equivalent in the source data. Rather than hand-translating 78
 * combinations, this reconstructs the windows from the normalized numeric arrays and formats
 * them per language — 12-hour clock for English, 24-hour for Spanish.
 *
 * `data/types.ts` warns that reconstructing display text from those arrays is a trap, and it
 * is right about the naive version: min/max over a midnight-spanning set yields 0..23 and
 * reads as "all day", which is wrong for 23 of 80 fish. The fix is to work in contiguous
 * runs and merge only the true wraparound:
 *
 *   barreleye  hours [21,22,23,0,1,2,3] -> runs [0-3] and [21-23]
 *              a run touching 0 plus a run touching 23 is ONE window, 21 -> 4
 *
 * English output is still taken verbatim from upstream, so this changes nothing for the
 * existing language; it only supplies the Spanish rendering.
 */

import type { Availability } from '../data/types.ts';
import type { Lang } from './lang.ts';
import { messagesFor } from './messages.ts';

/** Ascending contiguous runs of an already-deduped integer set. */
const runsOf = (values: readonly number[]): Array<[number, number]> => {
  const sorted = [...values].sort((a, b) => a - b);
  const runs: Array<[number, number]> = [];
  for (const v of sorted) {
    const last = runs[runs.length - 1];
    if (last && v === last[1] + 1) last[1] = v;
    else runs.push([v, v]);
  }
  return runs;
};

/** Spanish month abbreviations, lowercase per Spanish convention (unlike English "Mar"). */
const MONTHS_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

const monthName = (m: number): string => MONTHS_ES[m - 1] ?? String(m);

/** 24-hour clock, which is what Spanish-language ACNH players expect. */
const hour24 = (h: number): string => `${h}:00`;

/**
 * Month windows. Runs are NOT merged across the year boundary: a southern-hemisphere critter
 * available Jan–Mar and Nov–Dec has two genuinely separate seasons, and collapsing them into
 * "Nov - Mar" would claim availability in months it is absent.
 */
export const monthsTextIn = (a: Availability, lang: Lang): string[] => {
  if (lang === 'en') return a.monthsText;

  const runs = runsOf(a.months);
  if (runs.length === 1 && runs[0]![0] === 1 && runs[0]![1] === 12) {
    return [`${monthName(1)} - ${monthName(12)}`];
  }
  return runs.map(([s, e]) => (s === e ? monthName(s) : `${monthName(s)} - ${monthName(e)}`));
};

/**
 * Hour windows. The end hour is exclusive in display terms: upstream renders the set
 * 16..23,0..8 as "4 PM – 9 AM", i.e. the last catchable hour is 8, shown as 9. Adding one
 * keeps parity with the upstream English rather than inventing a different convention.
 */
export const hoursTextIn = (a: Availability, lang: Lang): string[] => {
  if (lang === 'en') return a.hoursText;

  const t = messagesFor(lang);
  if (a.hours.length >= 24) return [t.allDay];

  const runs = runsOf(a.hours);

  /*
    A run ending at 23 and a run starting at 0 are the two halves of one window crossing
    midnight; stitch them so a night-active fish reads as one window ("21:00–4:00") rather
    than two ("0:00–4:00", "21:00–24:00").

    This must handle THREE runs, not just two: piranha and giant isopod are catchable
    9 AM–4 PM *and* 9 PM–4 AM, giving [0-3], [9-15], [21-23]. Only the first and last runs
    merge — the daytime window in the middle is untouched and stays a separate window.
  */
  const merged: Array<[number, number]> = [...runs];
  if (merged.length > 1) {
    const first = merged[0]!;
    const last = merged[merged.length - 1]!;
    if (first[0] === 0 && last[1] === 23) {
      merged.pop();
      merged.shift();
      // The wraparound window starts late and ends early, so it sorts ahead of the rest.
      merged.unshift([last[0], first[1]]);
    }
  }

  // `(e + 1) % 24` renders an end of 23 as "0:00" — correct for a window closing at midnight.
  const text = merged.map(([s, e]) => `${hour24(s)}–${hour24((e + 1) % 24)}`);

  /*
    Upstream orders multi-window text by clock time (the daytime window first), so match it
    rather than leading with the wraparound and disagreeing with the English view.
  */
  return text.length > 1
    ? [...merged]
        .map((r, i) => ({ r, s: text[i]! }))
        .sort((x, y) => x.r[0] - y.r[0])
        .map((x) => x.s)
    : text;
};
