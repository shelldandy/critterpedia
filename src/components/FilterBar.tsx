import { useId, useState } from 'react';

import type { Kind, Shadow, Weather, WhereGroup } from '../data/types.ts';
import {
  SORT_LABELS,
  SORT_ORDER,
  activeFilterCount,
  isFilterActive,
  type CritterFilter,
  type Scope,
  type SortKey,
} from '../domain/filters.ts';

const KINDS: ReadonlyArray<{ key: Kind; label: string }> = [
  { key: 'fish', label: 'Fish' },
  { key: 'bug', label: 'Bugs' },
  { key: 'sea', label: 'Sea' },
];

const SCOPES: ReadonlyArray<{ key: Scope; label: string }> = [
  { key: 'now', label: 'Now' },
  { key: 'all', label: 'All critters' },
];

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

  const set = <K extends keyof CritterFilter>(key: K, value: CritterFilter[K]) =>
    onChange({ ...filter, [key]: value });

  const activeCount = activeFilterCount(filter);

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[10rem] flex-1">
          <label htmlFor={searchId} className="sr-only">
            Search critters by name or location
          </label>
          <input
            id={searchId}
            type="search"
            value={filter.query}
            placeholder="Search name or location…"
            onChange={(e) => set('query', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent-600 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div
          role="group"
          aria-label="Scope"
          className="flex overflow-hidden rounded-lg border border-slate-300 text-xs dark:border-slate-600"
        >
          {SCOPES.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={filter.scope === s.key}
              onClick={() => set('scope', s.key)}
              className={`px-2.5 py-1.5 font-medium whitespace-nowrap ${
                filter.scope === s.key
                  ? 'bg-accent-600 text-white'
                  : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Kind" className="flex gap-1.5">
          {KINDS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter.kinds.has(key)}
              onClick={() => set('kinds', toggleIn(filter.kinds, key))}
              className={chipClass(filter.kinds.has(key))}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={chipClass(open || activeCount > filter.kinds.size)}
        >
          Filters
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
            Sort
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
          <div role="group" aria-label="Shadow">
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Shadow{' '}
              <span className="font-normal normal-case opacity-70">
                (fish &amp; sea creatures)
              </span>
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
                  {s}
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
                  {s}
                </button>
              ))}
            </div>
          </div>

          <ChipGroup
            label="Where (bugs)"
            values={WHERE_GROUPS}
            selected={filter.whereGroups}
            onToggle={(v) => set('whereGroups', toggleIn(filter.whereGroups, v))}
          />

          <ChipGroup
            label="Weather (bugs)"
            values={WEATHERS}
            selected={filter.weathers}
            onToggle={(v) => set('weathers', toggleIn(filter.weathers, v))}
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <p>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {resultCount}
          </span>{' '}
          {filter.scope === 'now' ? 'catchable right now' : 'critters'}
          {isFilterActive(filter) && ' (filtered)'}
        </p>
        {isFilterActive(filter) && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg px-2 py-0.5 text-xs font-medium text-accent-700 hover:bg-accent-50 dark:text-accent-600 dark:hover:bg-slate-800"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};
