import type { TimeSel } from '../domain/filters.ts';
import { localeOf } from '../i18n/lang.ts';
import { useMessages } from '../i18n/useMessages.ts';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const chipClass = (selected: boolean): string =>
  `inline-flex min-w-14 items-center justify-center whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-medium tabular-nums transition-colors ${
    selected
      ? 'border-accent-600 bg-accent-600 text-white'
      : 'border-slate-300 bg-white text-slate-600 hover:border-accent-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400'
  }`;

export const WhenPicker = ({
  month,
  hour,
  onMonthChange,
  onHourChange,
  live,
}: {
  month: TimeSel;
  hour: TimeSel;
  onMonthChange: (value: TimeSel) => void;
  onHourChange: (value: TimeSel) => void;
  live: boolean;
}) => {
  const { t, lang } = useMessages();
  const locale = localeOf(lang);
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' });
  const hourFormatter = new Intl.DateTimeFormat(locale, { hour: 'numeric' });

  return (
    <div
      role="dialog"
      aria-label={t.when}
      className="absolute right-0 z-20 mt-2 w-[min(34rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.when}</p>
        {!live && <p className="text-right text-[11px] text-accent-700 dark:text-accent-500">{t.customWhenNotice}</p>}
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          {t.month}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={month === 'current'} onClick={() => onMonthChange('current')} className={chipClass(month === 'current')}>
            {t.current}
          </button>
          <button type="button" aria-pressed={month === 'any'} onClick={() => onMonthChange('any')} className={chipClass(month === 'any')}>
            {t.any}
          </button>
          {MONTHS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={month === value}
              onClick={() => onMonthChange(value)}
              className={chipClass(month === value)}
            >
              {monthFormatter.format(new Date(2020, value - 1, 1))}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          {t.hour}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={hour === 'current'} onClick={() => onHourChange('current')} className={chipClass(hour === 'current')}>
            {t.current}
          </button>
          <button type="button" aria-pressed={hour === 'any'} onClick={() => onHourChange('any')} className={chipClass(hour === 'any')}>
            {t.any}
          </button>
          {HOURS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={hour === value}
              onClick={() => onHourChange(value)}
              className={chipClass(hour === value)}
            >
              {hourFormatter.format(new Date(2020, 0, 1, value))}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
