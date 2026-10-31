import { useEffect, useId, useRef, useState } from 'react';

import { localeOf } from '../i18n/lang.ts';
import { useMessages } from '../i18n/useMessages.ts';
import { useSettings } from '../store/useSettings.ts';
import { LangPicker } from './LangPicker.tsx';
import { SchemePicker } from './SchemePicker.tsx';
import { ThemePicker } from './ThemePicker.tsx';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const pad = (n: number): string => String(n).padStart(2, '0');
const atMonth = (month: number, now: Date): string =>
  `${now.getFullYear()}-${pad(month)}-01T${pad(now.getHours())}:${pad(now.getMinutes())}`;

export const Header = ({ now }: { now: Date }) => {
  const { hemisphere, clockOverride, setHemisphere, setClockOverride } = useSettings();
  const { t, lang } = useMessages();
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const monthTriggerRef = useRef<HTMLButtonElement>(null);
  const monthPickerId = useId();
  const monthFormatter = new Intl.DateTimeFormat(localeOf(lang), { month: 'long' });

  useEffect(() => {
    if (!monthPickerOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!monthPickerRef.current?.contains(event.target as Node)) setMonthPickerOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMonthPickerOpen(false);
        monthTriggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [monthPickerOpen]);

  const selectMonth = (month: number) => {
    setClockOverride(atMonth(month, now));
    setMonthPickerOpen(false);
    monthTriggerRef.current?.focus();
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
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

        <div ref={monthPickerRef} className="relative flex items-center gap-1.5">
          <button
            ref={monthTriggerRef}
            type="button"
            aria-label={t.overrideTime}
            aria-haspopup="dialog"
            aria-expanded={monthPickerOpen}
            aria-controls={monthPickerId}
            onClick={() => setMonthPickerOpen((open) => !open)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs capitalize text-slate-700 hover:border-accent-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {monthFormatter.format(now)}
            <span aria-hidden>▾</span>
          </button>
          {monthPickerOpen && (
            <div
              id={monthPickerId}
              role="dialog"
              aria-label={t.month}
              className="absolute right-0 top-full z-20 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div role="group" aria-label={t.month} className="grid grid-cols-3 gap-1.5">
                {MONTHS.map((month) => (
                  <button
                    key={month}
                    type="button"
                    autoFocus={now.getMonth() + 1 === month}
                    aria-pressed={now.getMonth() + 1 === month}
                    onClick={() => selectMonth(month)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors ${
                      now.getMonth() + 1 === month
                        ? 'border-accent-600 bg-accent-600 text-white'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-accent-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    {monthFormatter.format(new Date(2020, month - 1, 1))}
                  </button>
                ))}
              </div>
            </div>
          )}
          {clockOverride && (
            <button
              type="button"
              onClick={() => {
                setClockOverride(null);
                setMonthPickerOpen(false);
              }}
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
