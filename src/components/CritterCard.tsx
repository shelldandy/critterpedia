import { useState } from 'react';

import { iconUrl } from '../data/critters.ts';
import type { Hemisphere } from '../data/types.ts';
import { windowFor } from '../domain/availability.ts';
import type { Urgency } from '../domain/urgency.ts';

const KIND_LABEL: Record<string, string> = {
  fish: 'Fish',
  bug: 'Bug',
  sea: 'Sea',
};

const KIND_STYLE: Record<string, string> = {
  fish: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  bug: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  sea: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
};

/** Images come from a third-party CDN that may not outlive the app — degrade, never break. */
const IconWithFallback = ({ src, alt }: { src: string; alt: string }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        aria-hidden
        className="size-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700"
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width={40}
      height={40}
      className="size-10 shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
};

export const CritterCard = ({
  urgency,
  hemisphere,
}: {
  urgency: Urgency;
  hemisphere: Hemisphere;
}) => {
  const { critter: c, hoursLeft, leavingThisMonth, closingSoon } = urgency;
  const w = windowFor(c, hemisphere);

  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <IconWithFallback src={iconUrl(c)} alt="" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-slate-900 capitalize dark:text-slate-100">
            {c.name}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${KIND_STYLE[c.kind]}`}
          >
            {KIND_LABEL[c.kind]}
          </span>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 dark:text-slate-400">
          {c.whereHow && <span>{c.whereHow}</span>}
          {c.shadow && <span>· Shadow {c.shadow}</span>}
          {c.movementSpeed && <span>· {c.movementSpeed}</span>}
          {c.weather && c.weather !== 'Any weather' && <span>· {c.weather}</span>}
        </div>

        {/*
          Rendered from the upstream display strings, never reconstructed from the hour
          array — min/max on a midnight-spanning window would read as "all day".
        */}
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
          {w.hoursText.join(', ')} · {w.monthsText.join(', ')}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-semibold text-slate-700 tabular-nums dark:text-slate-300">
          {c.sell.toLocaleString()}
          <span className="ml-0.5 text-xs font-normal text-slate-500">bells</span>
        </span>
        {closingSoon && hoursLeft !== null && (
          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {hoursLeft}h left today
          </span>
        )}
        {leavingThisMonth && !closingSoon && (
          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
            Last month
          </span>
        )}
      </div>
    </li>
  );
};
