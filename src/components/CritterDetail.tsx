import { useEffect, useRef, type SyntheticEvent } from 'react';
import { iconUrl } from '../data/critters.ts';
import type { Hemisphere } from '../data/types.ts';
import { windowFor } from '../domain/availability.ts';
import type { ResolvedWhen, SelectedCritter } from '../domain/filters.ts';
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
import { IconWithFallback } from './IconWithFallback.tsx';

const kindLabel = (kind: string, t: Messages): string =>
  kind === 'fish' ? t.badgeFish : kind === 'bug' ? t.badgeBug : t.badgeSea;

const KIND_STYLE: Record<string, string> = {
  fish: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  bug: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  sea: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const stripChip = (available: boolean, selected: boolean): string =>
  `flex min-h-8 items-center justify-center rounded-md border px-1 text-[11px] font-medium tabular-nums ${
    available
      ? 'border-accent-200 bg-accent-50 text-accent-800 dark:border-accent-900 dark:bg-slate-800 dark:text-accent-400'
      : 'border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-600'
  } ${selected ? 'ring-2 ring-accent-600 ring-offset-1 ring-offset-white dark:ring-offset-slate-900' : ''}`;

export const CritterDetail = ({
  item,
  hemisphere,
  when,
  onClose,
}: {
  item: SelectedCritter | null;
  hemisphere: Hemisphere;
  when: ResolvedWhen;
  onClose: () => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t, lang } = useMessages();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (item && !dialog.open) dialog.showModal();
    if (!item && dialog.open) dialog.close();
  }, [item]);

  const closeFromCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  if (!item) {
    return <dialog ref={dialogRef} aria-label={t.close} />;
  }

  const c = item.critter;
  const w = windowFor(c, hemisphere);
  const name = nameIn(c, lang);
  const monthFormatter = new Intl.DateTimeFormat(localeOf(lang), { month: 'short' });
  const hourFormatter = new Intl.DateTimeFormat(localeOf(lang), { hour: 'numeric' });

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="critter-detail-title"
      onCancel={closeFromCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed top-1/2 left-1/2 m-0 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="flex items-start gap-4 p-5 pb-3">
        <IconWithFallback
          src={iconUrl(c)}
          alt={name}
          className="size-24 shrink-0 rounded-xl bg-slate-50 object-contain dark:bg-slate-950"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${KIND_STYLE[c.kind]}`}
              >
                {kindLabel(c.kind, t)}
              </span>
              <h2
                id="critter-detail-title"
                className="mt-1 text-xl font-semibold first-letter:uppercase"
              >
                {name}
              </h2>
            </div>
            <button
              type="button"
              aria-label={t.close}
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              ×
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
            {c.whereHow && <span>{whereHowLabel(c.whereHow, lang)}</span>}
            {c.shadow && <span>· {t.shadowPrefix} {shadowLabel(c.shadow, lang)}</span>}
            {c.movementSpeed && <span>· {speedLabel(c.movementSpeed, lang)}</span>}
            {c.weather && c.weather !== 'Any weather' && (
              <span>· {weatherLabel(c.weather, lang)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {hoursTextIn(w, lang).join(', ')} · {monthsTextIn(w, lang).join(', ')}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-sm font-semibold text-slate-700 tabular-nums dark:text-slate-300">
            {c.sell.toLocaleString(localeOf(lang))}
            <span className="ml-1 text-xs font-normal text-slate-500">{t.bells}</span>
          </span>
          {!item.available && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {t.notNow}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-200 px-5 py-4 dark:border-slate-700">
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            {t.month}
          </p>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {MONTHS.map((month) => (
              <div
                key={month}
                aria-label={monthFormatter.format(new Date(2020, month - 1, 1))}
                className={stripChip(
                  w.months.includes(month),
                  when.month === month,
                )}
              >
                {monthFormatter.format(new Date(2020, month - 1, 1))}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            {t.hour}
          </p>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {HOURS.map((hour) => (
              <div
                key={hour}
                aria-label={hourFormatter.format(new Date(2020, 0, 1, hour))}
                className={stripChip(w.hours.includes(hour), when.hour === hour)}
              >
                {hourFormatter.format(new Date(2020, 0, 1, hour))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  );
};
