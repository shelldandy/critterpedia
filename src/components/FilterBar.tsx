import { useId, useState } from 'react';

import type { Kind, Shadow, Weather, WhereGroup } from '../data/types.ts';
import {
  SORT_ORDER,
  activeFilterCount,
  isFilterActive,
  sortLabels,
  type CritterFilter,
  type SortKey,
  type TimeSel,
} from '../domain/filters.ts';
import { shadowLabel, weatherLabel, whereGroupLabel } from '../i18n/critterTerms.ts';
import { localeOf } from '../i18n/lang.ts';
import { useMessages } from '../i18n/useMessages.ts';
import { WhenPicker } from './WhenPicker.tsx';

const KIND_KEYS: readonly Kind[] = ['fish', 'bug', 'sea'];

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

const Icon = ({ type }: { type: 'all' | Kind | 'calendar' | 'filter' }) => {
  if (type === 'all') {
    return <span aria-hidden className="text-xl leading-none">✦</span>;
  }
  if (type === 'fish') return <span aria-hidden className="text-xl leading-none">🐟</span>;
  if (type === 'bug') return <span aria-hidden className="text-xl leading-none">🐞</span>;
  if (type === 'sea') return <span aria-hidden className="text-xl leading-none">🐚</span>;
  if (type === 'calendar') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4.5" width="18" height="16" rx="2" />
        <path d="M7 3v3M17 3v3M3 9h18" />
      </svg>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5h16l-6.2 7.1V18l-3.6 1.8v-7.7L4 5Z" />
    </svg>
  );
};

const whenSummary = (filter: CritterFilter, now: Date, lang: Parameters<typeof localeOf>[0], t: ReturnType<typeof useMessages>['t']): string => {
  const locale = localeOf(lang);
  const month =
    filter.month === 'any'
      ? t.any
      : new Intl.DateTimeFormat(locale, { month: 'short' }).format(
          new Date(2020, (filter.month === 'current' ? now.getMonth() : filter.month - 1), 1),
        );
  const hour =
    filter.hour === 'any'
      ? t.any
      : new Intl.DateTimeFormat(locale, { hour: 'numeric' }).format(
          new Date(2020, 0, 1, filter.hour === 'current' ? now.getHours() : filter.hour),
        );
  return `${month} · ${hour}`;
};

export const FilterBar = ({
  filter,
  onChange,
  onClear,
  resultCount,
  now,
}: {
  filter: CritterFilter;
  onChange: (next: CritterFilter) => void;
  onClear: () => void;
  resultCount: number;
  now: Date;
}) => {
  const [open, setOpen] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const searchId = useId();
  const sortId = useId();
  const { t, lang } = useMessages();
  const sortText = sortLabels(t);
  const kindLabels: Record<Kind, string> = {
    fish: t.kindFish,
    bug: t.kindBugs,
    sea: t.kindSea,
  };
  const activeCount = activeFilterCount(filter);
  const secondaryActive =
    filter.shadows.size +
    filter.whereGroups.size +
    filter.weathers.size +
    (filter.month === 'current' ? 0 : 1) +
    (filter.hour === 'current' ? 0 : 1);
  const live = filter.month === 'current' && filter.hour === 'current';

  const set = <K extends keyof CritterFilter>(key: K, value: CritterFilter[K]) =>
    onChange({ ...filter, [key]: value });

  const selectKind = (kind: Kind | 'all') =>
    set('kinds', kind === 'all' ? new Set<Kind>() : new Set<Kind>([kind]));

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label={t.kind} className="flex gap-1.5">
          <button
            type="button"
            role="tab"
            aria-selected={filter.kinds.size === 0}
            onClick={() => selectKind('all')}
            className={`flex min-w-14 flex-col items-center justify-center rounded-xl border px-2 py-1.5 text-xs font-medium transition-colors ${chipClass(filter.kinds.size === 0)}`}
          >
            <Icon type="all" />
            <span>{t.kindAll}</span>
          </button>
          {KIND_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter.kinds.size === 1 && filter.kinds.has(key)}
              onClick={() => selectKind(key)}
              className={`flex min-w-14 flex-col items-center justify-center rounded-xl border px-2 py-1.5 text-xs font-medium transition-colors ${chipClass(filter.kinds.size === 1 && filter.kinds.has(key))}`}
            >
              <Icon type={key} />
              <span>{kindLabels[key]}</span>
            </button>
          ))}
        </div>

        <div className="relative ml-auto flex items-center gap-1.5">
          <button
            type="button"
            aria-label={t.when}
            aria-expanded={whenOpen}
            onClick={() => setWhenOpen((value) => !value)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium ${
              !live
                ? 'border-accent-600 bg-accent-50 text-accent-700 dark:bg-slate-800 dark:text-accent-500'
                : 'border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            <Icon type="calendar" />
            <span>{live ? t.when : whenSummary(filter, now, lang, t)}</span>
          </button>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className={chipClass(open || secondaryActive > 0)}
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon type="filter" />
              {t.filters}
              {activeCount > 0 && (
                <span className="rounded-full bg-accent-600 px-1.5 text-[10px] text-white">
                  {activeCount}
                </span>
              )}
            </span>
          </button>
          {whenOpen && (
            <WhenPicker
              month={filter.month}
              hour={filter.hour}
              onMonthChange={(value: TimeSel) => set('month', value)}
              onHourChange={(value: TimeSel) => set('hour', value)}
              live={live}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <label htmlFor={searchId} className="sr-only">
            {t.searchLabel}
          </label>
          <input
            id={searchId}
            type="search"
            value={filter.query}
            placeholder={t.searchPlaceholder}
            onChange={(event) => set('query', event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent-600 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <button
              type="button"
              aria-pressed={filter.scope === 'now'}
              onClick={() => set('scope', filter.scope === 'now' ? 'all' : 'now')}
              className={chipClass(filter.scope === 'now')}
            >
              {t.hideUnavailable}
            </button>
            <div className="flex items-center gap-1.5">
              <label
                htmlFor={sortId}
                className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
              >
                {t.sort}
              </label>
              <select
                id={sortId}
                value={filter.sort}
                onChange={(event) => set('sort', event.target.value as SortKey)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-accent-600 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
              >
                {SORT_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {sortText[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div role="group" aria-label={t.shadow}>
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              {t.shadow}{' '}
              <span className="font-normal normal-case opacity-70">{t.shadowNote}</span>
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {SIZE_SHADOWS.map((shadow) => (
                <button
                  key={shadow}
                  type="button"
                  aria-pressed={filter.shadows.has(shadow)}
                  onClick={() => set('shadows', toggleIn(filter.shadows, shadow))}
                  className={chipClass(filter.shadows.has(shadow))}
                >
                  {shadowLabel(shadow, lang)}
                </button>
              ))}
              <span aria-hidden className="mx-1 h-4 w-px bg-slate-300 dark:bg-slate-600" />
              {SHAPE_SHADOWS.map((shadow) => (
                <button
                  key={shadow}
                  type="button"
                  aria-pressed={filter.shadows.has(shadow)}
                  onClick={() => set('shadows', toggleIn(filter.shadows, shadow))}
                  className={chipClass(filter.shadows.has(shadow))}
                >
                  {shadowLabel(shadow, lang)}
                </button>
              ))}
            </div>
          </div>

          <ChipGroup
            label={t.whereBugs}
            values={WHERE_GROUPS}
            selected={filter.whereGroups}
            onToggle={(value) => set('whereGroups', toggleIn(filter.whereGroups, value))}
            format={(value) => whereGroupLabel(value, lang)}
          />
          <ChipGroup
            label={t.weatherBugs}
            values={WEATHERS}
            selected={filter.weathers}
            onToggle={(value) => set('weathers', toggleIn(filter.weathers, value))}
            format={(value) => weatherLabel(value, lang)}
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <p>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {resultCount.toLocaleString(localeOf(lang))}
          </span>{' '}
          {filter.scope === 'now' && live
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
