import { useMemo, useState } from 'react';

import { CRITTERS } from '../data/critters.ts';
import type { Hemisphere, Kind } from '../data/types.ts';
import { BAND_LABELS, BAND_ORDER, groupByBand, rankCatchableNow } from '../domain/urgency.ts';
import { CritterCard } from './CritterCard.tsx';

const KINDS: ReadonlyArray<{ key: Kind; label: string }> = [
  { key: 'fish', label: 'Fish' },
  { key: 'bug', label: 'Bugs' },
  { key: 'sea', label: 'Sea' },
];

const BAND_ACCENT: Record<string, string> = {
  closing: 'text-rose-700 dark:text-rose-400',
  leaving: 'text-orange-700 dark:text-orange-400',
  new: 'text-leaf-700 dark:text-leaf-600',
  rest: 'text-slate-500 dark:text-slate-400',
};

export const NowPanel = ({ now, hemisphere }: { now: Date; hemisphere: Hemisphere }) => {
  const [kinds, setKinds] = useState<Set<Kind>>(new Set(['fish', 'bug', 'sea']));

  const ranked = useMemo(
    () => rankCatchableNow(CRITTERS, now, hemisphere),
    [now, hemisphere],
  );
  const visible = useMemo(
    () => ranked.filter((u) => kinds.has(u.critter.kind)),
    [ranked, kinds],
  );
  const grouped = useMemo(() => groupByBand(visible), [visible]);

  const toggle = (k: Kind) =>
    setKinds((prev) => {
      const next = new Set(prev);
      // Never let the user filter down to nothing — re-selecting the last kind is a no-op.
      if (next.has(k) && next.size > 1) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <section className="mx-auto max-w-2xl px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <p className="mr-auto text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {visible.length}
          </span>{' '}
          catchable right now
        </p>
        <div className="flex gap-1.5">
          {KINDS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={kinds.has(key)}
              onClick={() => toggle(key)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                kinds.has(key)
                  ? 'border-leaf-600 bg-leaf-50 text-leaf-700 dark:bg-slate-800 dark:text-leaf-600'
                  : 'border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
          Nothing is catchable at this hour. Try another time.
        </p>
      )}

      {BAND_ORDER.map((band) => {
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
                <CritterCard key={u.critter.id} urgency={u} hemisphere={hemisphere} />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
};
