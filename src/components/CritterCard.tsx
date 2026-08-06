import { useState } from 'react';

import { iconUrl } from '../data/critters.ts';
import type { Hemisphere } from '../data/types.ts';
import { isAvailableNow, windowFor } from '../domain/availability.ts';
import type { Urgency } from '../domain/urgency.ts';
import { hoursTextIn, monthsTextIn } from '../i18n/availabilityText.ts';
import {
  shadowLabel,
  speedLabel,
  weatherLabel,
  whereHowLabel,
} from '../i18n/critterTerms.ts';
import { localeOf, nameIn } from '../i18n/lang.ts';
import type { Messages } from '../i18n/messages.ts';
import { useMessages } from '../i18n/useMessages.ts';

const kindLabel = (kind: string, t: Messages): string =>
  kind === 'fish' ? t.badgeFish : kind === 'bug' ? t.badgeBug : t.badgeSea;

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
  now,
}: {
  urgency: Urgency;
  hemisphere: Hemisphere;
  /** Supplied only in the All-critters view, where entries may be out of season. */
  now?: Date;
}) => {
  const { critter: c, hoursLeft, leavingThisMonth, closingSoon } = urgency;
  const { t, lang } = useMessages();
  const w = windowFor(c, hemisphere);
  /*
    In the "now" scope everything listed is catchable, so no badge is needed. In the "all"
    scope the list is mostly *not* catchable, and a card that looks identical either way
    would be a confident wrong answer — the one thing the README forbids.
  */
  const unavailable = now !== undefined && !isAvailableNow(c, now, hemisphere);

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 ${
        unavailable ? 'opacity-60' : ''
      }`}
    >
      <IconWithFallback src={iconUrl(c)} alt="" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {/*
            `first-letter:uppercase`, not `capitalize`: upstream names are lowercased
            inconsistently, but Title Case is wrong in Spanish, which does not capitalize
            common nouns ("pez espada", never "Pez Espada"). Sentence case is correct in
            both languages and still tidies the ragged upstream casing.
          */}
          <span className="truncate font-medium text-slate-900 first-letter:uppercase dark:text-slate-100">
            {nameIn(c, lang)}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${KIND_STYLE[c.kind]}`}
          >
            {kindLabel(c.kind, t)}
          </span>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 dark:text-slate-400">
          {c.whereHow && <span>{whereHowLabel(c.whereHow, lang)}</span>}
          {c.shadow && (
            <span>
              · {t.shadowPrefix} {shadowLabel(c.shadow, lang)}
            </span>
          )}
          {c.movementSpeed && <span>· {speedLabel(c.movementSpeed, lang)}</span>}
          {/*
            The `!== 'Any weather'` test stays on the raw English data value, NOT on the
            translated label: comparing display text would silently stop suppressing the
            default once translated, tagging all 45 fair-weather bugs with a useless chip.
          */}
          {c.weather && c.weather !== 'Any weather' && (
            <span>· {weatherLabel(c.weather, lang)}</span>
          )}
        </div>

        {/*
          Never reconstructed naively from the hour array — min/max on a midnight-spanning
          window would read as "all day". English is the upstream text verbatim; Spanish is
          rebuilt from the numeric arrays run-by-run. See `i18n/availabilityText.ts`.
        */}
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
          {hoursTextIn(w, lang).join(', ')} · {monthsTextIn(w, lang).join(', ')}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-semibold text-slate-700 tabular-nums dark:text-slate-300">
          {c.sell.toLocaleString(localeOf(lang))}
          <span className="ml-0.5 text-xs font-normal text-slate-500">{t.bells}</span>
        </span>
        {unavailable && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {t.notNow}
          </span>
        )}
        {!unavailable && closingSoon && hoursLeft !== null && (
          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {t.hoursLeftToday(hoursLeft)}
          </span>
        )}
        {!unavailable && leavingThisMonth && !closingSoon && (
          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
            {t.lastMonth}
          </span>
        )}
      </div>
    </li>
  );
};
