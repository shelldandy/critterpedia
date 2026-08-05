import { useEffect, useState } from 'react';

import { useSettings } from '../store/useSettings.ts';

/**
 * The current time the app reasons about — either the device clock or the manual override.
 *
 * Availability only ever depends on the hour, so this re-renders on the hour boundary
 * rather than every second. It schedules to the exact next :00 instead of polling on an
 * interval, so the list flips over precisely when the in-game window does.
 */
export const useNow = (): Date => {
  const clockOverride = useSettings((s) => s.clockOverride);
  const [tick, setTick] = useState(() => new Date());

  useEffect(() => {
    if (clockOverride) return;

    let timer: ReturnType<typeof setTimeout>;

    const scheduleNextHour = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(now.getHours() + 1, 0, 0, 0);
      timer = setTimeout(() => {
        setTick(new Date());
        scheduleNextHour();
      }, next.getTime() - now.getTime());
    };

    setTick(new Date());
    scheduleNextHour();
    return () => clearTimeout(timer);
  }, [clockOverride]);

  if (clockOverride) {
    const parsed = new Date(clockOverride);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return tick;
};
