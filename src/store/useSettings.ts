import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Hemisphere } from '../data/types.ts';

interface SettingsState {
  hemisphere: Hemisphere;
  /**
   * Manual clock override as an ISO-ish local string, or null to follow the device clock.
   * ACNH runs on the console clock and this audience time-travels, so silently trusting
   * device time would be wrong. Doubles as a planning tool ("what's out at 3 AM?").
   */
  clockOverride: string | null;
  setHemisphere: (h: Hemisphere) => void;
  setClockOverride: (iso: string | null) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      hemisphere: 'north',
      clockOverride: null,
      setHemisphere: (hemisphere) => set({ hemisphere }),
      setClockOverride: (clockOverride) => set({ clockOverride }),
    }),
    { name: 'acnh-hunt-settings', version: 1 },
  ),
);
