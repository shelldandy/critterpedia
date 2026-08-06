import { useMessages } from '../i18n/useMessages.ts';
import { useSettings } from '../store/useSettings.ts';
import { LangPicker } from './LangPicker.tsx';
import { SchemePicker } from './SchemePicker.tsx';
import { ThemePicker } from './ThemePicker.tsx';

/** `<input type="datetime-local">` wants local wall-clock time, not a UTC ISO string. */
const toLocalInput = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const Header = ({ now }: { now: Date }) => {
  const { hemisphere, clockOverride, setHemisphere, setClockOverride } = useSettings();
  const { t } = useMessages();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-3 px-4 py-3">
        <h1 className="mr-auto text-base font-semibold text-slate-900 dark:text-slate-100">
          {t.appName}
        </h1>

        <div
          role="group"
          aria-label={t.hemisphere}
          className="flex overflow-hidden rounded-lg border border-slate-300 text-xs dark:border-slate-600"
        >
          {/*
            The label comes from the catalog rather than from CSS `capitalize` on the state
            value: 'north'/'south' are data, and relying on them as display text cannot
            survive translation.
          */}
          {([
            ['north', t.north],
            ['south', t.south],
          ] as const).map(([h, label]) => (
            <button
              key={h}
              type="button"
              aria-pressed={hemisphere === h}
              onClick={() => setHemisphere(h)}
              className={`px-2.5 py-1.5 font-medium ${
                hemisphere === h
                  ? 'bg-accent-600 text-white'
                  : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="datetime-local"
            aria-label={t.overrideTime}
            value={toLocalInput(now)}
            onChange={(e) => setClockOverride(e.target.value || null)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          />
          {clockOverride && (
            <button
              type="button"
              onClick={() => setClockOverride(null)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-accent-700 hover:bg-accent-50 dark:text-accent-600 dark:hover:bg-slate-800"
            >
              {t.resetToNow}
            </button>
          )}
        </div>

        <LangPicker />
        <SchemePicker />
        <ThemePicker />
      </div>

      {clockOverride && (
        <p className="bg-amber-100 px-4 py-1 text-center text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {t.customTimeNotice}
        </p>
      )}
    </header>
  );
};
