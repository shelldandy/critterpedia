import { useMemo, useState } from 'react';

import { CRITTERS } from '../data/critters.ts';
import type { Hemisphere } from '../data/types.ts';
import {
  EMPTY_FILTER,
  isFilterActive,
  keepsBands,
  selectCritters,
  type CritterFilter,
} from '../domain/filters.ts';
import { BAND_LABELS, BAND_ORDER, groupByBand } from '../domain/urgency.ts';
import { CritterCard } from './CritterCard.tsx';
import { FilterBar } from './FilterBar.tsx';

const BAND_ACCENT: Record<string, string> = {
  closing: 'text-rose-700 dark:text-rose-400',
  leaving: 'text-orange-700 dark:text-orange-400',
  new: 'text-accent-700 dark:text-accent-600',
  rest: 'text-slate-500 dark:text-slate-400',
};

/** Distinguishes "nothing is out at this hour" from "your filters excluded everything". */
const EmptyState = ({ filter }: { filter: CritterFilter }) => {
  const filtered = isFilterActive(filter);
  return (
    <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
      {filtered
        ? 'No critters match these filters. Try clearing one.'
        : 'Nothing is catchable at this hour. Try another time.'}
    </p>
  );
};

export const NowPanel = ({ now, hemisphere }: { now: Date; hemisphere: Hemisphere }) => {
  const [filter, setFilter] = useState<CritterFilter>(EMPTY_FILTER);

  const visible = useMemo(
    () => selectCritters(CRITTERS, filter, now, hemisphere),
    [filter, now, hemisphere],
  );
  const grouped = useMemo(() => groupByBand(visible), [visible]);

  /*
    Clearing keeps `scope` and `sort`: those answer "which question am I asking" and "in
    what order", not "which subset". Resetting them would yank the view out from under a
    user who only wanted to drop a shadow chip.
  */
  const clear = () =>
    setFilter((f) => ({ ...EMPTY_FILTER, scope: f.scope, sort: f.sort }));

  return (
    <section className="mx-auto max-w-2xl px-4 py-4">
      <FilterBar
        filter={filter}
        onChange={setFilter}
        onClear={clear}
        resultCount={visible.length}
      />

      {visible.length === 0 && <EmptyState filter={filter} />}

      {/*
        Bands only survive the urgency sort. Under any explicit sort the list flattens, so
        "sorted by price" means price order end to end rather than price-within-band.
      */}
      {keepsBands(filter.sort)
        ? BAND_ORDER.map((band) => {
            const items = grouped.get(band) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={band} className="mb-5">
                <h2
                  className={`mb-2 text-xs font-semibold tracking-wide uppercase ${BAND_ACCENT[band]}`}
                >
                  {BAND_LABELS[band]}{' '}
                  <span className="font-normal opacity-70">({items.length})</span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {items.map((u) => (
                    <CritterCard
                      key={u.critter.id}
                      urgency={u}
                      hemisphere={hemisphere}
                      now={filter.scope === 'all' ? now : undefined}
                    />
                  ))}
                </ul>
              </div>
            );
          })
        : visible.length > 0 && (
            <ul className="flex flex-col gap-2">
              {visible.map((u) => (
                <CritterCard
                  key={u.critter.id}
                  urgency={u}
                  hemisphere={hemisphere}
                  now={filter.scope === 'all' ? now : undefined}
                />
              ))}
            </ul>
          )}
    </section>
  );
};
