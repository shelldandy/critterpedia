import { useMemo, useState } from 'react';

import { CRITTERS } from '../data/critters.ts';
import type { Hemisphere } from '../data/types.ts';
import {
  EMPTY_FILTER,
  isFilterActive,
  resolveWhen,
  selectCritters,
  type CritterFilter,
  type SelectedCritter,
} from '../domain/filters.ts';
import { useMessages } from '../i18n/useMessages.ts';
import { useSettings } from '../store/useSettings.ts';
import { CritterDetail } from './CritterDetail.tsx';
import { CritterTile } from './CritterTile.tsx';
import { FilterBar } from './FilterBar.tsx';

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-1.5';

/** Distinguishes "nothing is out" from "your filters excluded everything". */
const EmptyState = ({ filter }: { filter: CritterFilter }) => {
  const { t } = useMessages();
  return (
    <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
      {isFilterActive(filter) ? t.emptyFiltered : t.emptyNothingNow}
    </p>
  );
};

const UrgencyLegend = () => {
  const { t } = useMessages();
  return (
    <div
      role="note"
      className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400"
    >
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="size-2 rounded-full bg-rose-500" />
        {t.closingSoonNote}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="size-2 rounded-full bg-orange-500" />
        {t.leavingThisMonthNote}
      </span>
    </div>
  );
};

export const NowPanel = ({ now, hemisphere }: { now: Date; hemisphere: Hemisphere }) => {
  const [filter, setFilter] = useState<CritterFilter>(EMPTY_FILTER);
  const [selected, setSelected] = useState<SelectedCritter | null>(null);
  const lang = useSettings((state) => state.lang);

  const visible = useMemo(
    () => selectCritters(CRITTERS, filter, now, hemisphere, lang),
    [filter, now, hemisphere, lang],
  );
  const when = useMemo(() => resolveWhen(filter, now), [filter, now]);

  const clear = () =>
    setFilter((current) => ({ ...EMPTY_FILTER, scope: current.scope, sort: current.sort }));

  return (
    <section className="mx-auto max-w-6xl px-4 py-4">
      <FilterBar
        filter={filter}
        onChange={setFilter}
        onClear={clear}
        resultCount={visible.length}
        now={now}
      />

      {visible.length === 0 && <EmptyState filter={filter} />}

      {visible.length > 0 && (
        <ul className={GRID}>
          {visible.map((item) => (
            <li key={item.critter.id}>
              <CritterTile
                item={item}
                isLive={when.isLive}
                onSelect={() => setSelected(item)}
              />
            </li>
          ))}
        </ul>
      )}

      <UrgencyLegend />

      <CritterDetail
        item={selected}
        hemisphere={hemisphere}
        when={when}
        onClose={() => setSelected(null)}
      />
    </section>
  );
};
