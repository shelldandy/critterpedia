import { useId, useState } from 'react';

import type { Kind, Shadow, Weather, WhereGroup } from '../data/types.ts';
import {
  SORT_ORDER,
  activeFilterCount,
  isFilterActive,
  sortLabels,
  type CritterFilter,
  type Scope,
  type SortKey,
} from '../domain/filters.ts';
import { shadowLabel, weatherLabel, whereGroupLabel } from '../i18n/critterTerms.ts';
import { localeOf } from '../i18n/lang.ts';
import { useMessages } from '../i18n/useMessages.ts';

/* Keys are data; labels come from the catalog at render time so they follow the language. */
const KIND_KEYS: readonly Kind[] = ['fish', 'bug', 'sea'];
const SCOPE_KEYS: readonly Scope[] = ['now', 'all'];

/*
  Ordered small→large, with the two shape-not-size shadows last and visually separated —
  the same distinction `shadowRank` enforces. Presenting `Long` inside the ramp would
  imply a size relationship the data does not claim.
*/
const SIZE_SHADOWS: readonly Shadow[] = [
  'X-Small',
  'Small',
  'Medium',
  'Large',
  'X-Large',
  'XX-Large',
];
const SHAPE_SHADOWS: readonly Shadow[] = ['Long', 'X-Large w/Fin'];

const WHERE_GROUPS: readonly WhereGroup[] = [
  'Trees',
  'Flowers',
  'Ground',
  'Flying',
  'Water',
  'Special',
];

const WEATHERS: readonly Weather[] = ['Any weather', 'Any except rain', 'Rain only'];

const chipClass = (on: boolean): string =>
  `rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
    on
      ? 'border-accent-600 bg-accent-50 text-accent-700 dark:bg-slate-800 dark:text-accent-600'
      : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-slate-500'
  }`;

/** Toggling a value in or out of a Set, without mutating the original. */
const toggleIn = <T,>(set: ReadonlySet<T>, value: T): Set<T> => {
  const next = new Set(set);
  if (!next.delete(value)) next.add(value);
  return next;
};

const ChipGroup = <T extends string>({
  label,
  values,
  selected,
  onToggle,
  format,
}: {
  label: string;
  values: readonly T[];
  selected: ReadonlySet<T>;
  onToggle: (v: T) => void;
  format?: (v: T) => string;
}) => (
  <div role="group" aria-label={label}>
    <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
      {label}
    </p>
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={selected.has(v)}
          onClick={() => onToggle(v)}
          className={chipClass(selected.has(v))}
        >
          {format ? format(v) : v}
        </button>
      ))}
    </div>
  </div>
);

/**
 * Search, scope, kind chips and sort sit on one always-visible row; the rarely-needed
 * facets hide behind a disclosure. The README's success test is that a player on a beach
 * at 11pm gets an answer without typing, so the default view must stay uncluttered.
 */
export const FilterBar = ({
  filter,
  onChange,
  onClear,
  resultCount,
}: {
  filter: CritterFilter;
  onChange: (next: CritterFilter) => void;
  onClear: () => void;
  resultCount: number;
}) => {
  const [open, setOpen] = useState(false);
  const searchId = useId();
  const sortId = useId();
  const { t, lang } = useMessages();
  const SORT_LABELS = sortLabels(t);
  const kindLabels: Record<Kind, string> = {
    fish: t.kindFish,
    bug: t.kindBugs,
    sea: t.kindSea,
  };
  const scopeLabels: Record<Scope, string> = { now: t.scopeNow, all: t.scopeAll };

  const set = <K extends keyof CritterFilter>(key: K, value: CritterFilter[K]) =>
    onChange({ ...filter, [key]: value });

  const activeCount = activeFilterCount(filter);

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[10rem] flex-1">
          <label htmlFor={searchId} className="sr-only">
            {t.searchLabel}
          </label>
          <input
            id={searchId}
            type="search"
            value={filter.query}
            placeholder={t.searchPlaceholder}
            onChange={(e) => set('query', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent-600 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div
          role="group"
          aria-label={t.scope}
          className="flex overflow-hidden rounded-lg border border-slate-300 text-xs dark:border-slate-600"
        >
          {SCOPE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter.scope === key}
              onClick={() => set('scope', key)}
              className={`px-2.5 py-1.5 font-medium whitespace-nowrap ${
                filter.scope === key
                  ? 'bg-accent-600 text-white'
                  : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {scopeLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label={t.kind} className="flex gap-1.5">
          {KIND_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter.kinds.has(key)}
              onClick={() => set('kinds', toggleIn(filter.kinds, key))}
              className={chipClass(filter.kinds.has(key))}
            >
              {kindLabels[key]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={chipClass(open || activeCount > filter.kinds.size)}
        >
          {t.filters}
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-accent-600 px-1.5 text-[10px] text-white">
              {activeCount}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <label
            htmlFor={sortId}
            className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
          >
            {t.sort}
          </label>
          <select
            id={sortId}
            value={filter.sort}
            onChange={(e) => set('sort', e.target.value as SortKey)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-accent-600 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
          >
            {SORT_ORDER.map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div role="group" aria-label={t.shadow}>
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              {t.shadow}{' '}
              <span className="font-normal normal-case opacity-70">{t.shadowNote}</span>
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {SIZE_SHADOWS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={filter.shadows.has(s)}
                  onClick={() => set('shadows', toggleIn(filter.shadows, s))}
                  className={chipClass(filter.shadows.has(s))}
                >
                  {shadowLabel(s, lang)}
                </button>
              ))}
              {/* Separated because these describe shape, not size — see types.ts. */}
              <span
                aria-hidden
                className="mx-1 h-4 w-px bg-slate-300 dark:bg-slate-600"
              />
              {SHAPE_SHADOWS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={filter.shadows.has(s)}
                  onClick={() => set('shadows', toggleIn(filter.shadows, s))}
                  className={chipClass(filter.shadows.has(s))}
                >
                  {shadowLabel(s, lang)}
                </button>
              ))}
            </div>
          </div>

          {/* `format` translates the chip label while the value stays the English data key. */}
          <ChipGroup
            label={t.whereBugs}
            values={WHERE_GROUPS}
            selected={filter.whereGroups}
            onToggle={(v) => set('whereGroups', toggleIn(filter.whereGroups, v))}
            format={(v) => whereGroupLabel(v, lang)}
          />

          <ChipGroup
            label={t.weatherBugs}
            values={WEATHERS}
            selected={filter.weathers}
            onToggle={(v) => set('weathers', toggleIn(filter.weathers, v))}
            format={(v) => weatherLabel(v, lang)}
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        {/*
          The count is inside the localized string rather than concatenated around it:
          Spanish needs number agreement ("1 criatura" vs "2 criaturas") that a fixed
          prefix/suffix split cannot express.
        */}
        <p>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {resultCount.toLocaleString(localeOf(lang))}
          </span>{' '}
          {filter.scope === 'now'
            ? t.catchableNowSuffix(resultCount, isFilterActive(filter))
            : t.critterCountSuffix(resultCount, isFilterActive(filter))}
        </p>
        {isFilterActive(filter) && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg px-2 py-0.5 text-xs font-medium text-accent-700 hover:bg-accent-50 dark:text-accent-600 dark:hover:bg-slate-800"
          >
            {t.clearFilters}
          </button>
        )}
      </div>
    </div>
  );
};
