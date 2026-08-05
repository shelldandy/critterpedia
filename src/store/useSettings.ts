import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Hemisphere } from '../data/types.ts';
import { DEFAULT_SCHEME, applyScheme, isScheme, type Scheme } from '../theme/scheme.ts';
import { DEFAULT_THEME_ID, applyTheme, isThemeId, type ThemeId } from '../theme/themes.ts';

interface SettingsState {
  hemisphere: Hemisphere;
  /** Accent color id. The ramp itself lives in CSS variables — see `theme/themes.ts`. */
  theme: ThemeId;
  /** Light/dark preference. 'system' defers to the OS — see `theme/scheme.ts`. */
  scheme: Scheme;
  /**
   * Manual clock override as an ISO-ish local string, or null to follow the device clock.
   * ACNH runs on the console clock and this audience time-travels, so silently trusting
   * device time would be wrong. Doubles as a planning tool ("what's out at 3 AM?").
   */
  clockOverride: string | null;
  setHemisphere: (h: Hemisphere) => void;
  setClockOverride: (iso: string | null) => void;
  setTheme: (t: ThemeId) => void;
  setScheme: (s: Scheme) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      hemisphere: 'north',
      theme: DEFAULT_THEME_ID,
      scheme: DEFAULT_SCHEME,
      clockOverride: null,
      setHemisphere: (hemisphere) => set({ hemisphere }),
      setClockOverride: (clockOverride) => set({ clockOverride }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setScheme: (scheme) => {
        applyScheme(scheme);
        set({ scheme });
      },
    }),
    {
      name: 'acnh-hunt-settings',
      version: 3,
      /*
        Each bump adds a field; zustand drops the entire persisted object on a version
        mismatch without this, which would silently reset an existing user's hemisphere.
        Cumulative and order-independent, so a v1 record upgrades straight to v3.
      */
      migrate: (persisted, from) => {
        const state = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...state,
          ...(from < 2 ? { theme: DEFAULT_THEME_ID } : {}),
          ...(from < 3 ? { scheme: DEFAULT_SCHEME } : {}),
        };
      },
      /*
        Sanitize here rather than in `migrate` — migrate only runs on a version mismatch, so
        a hand-edited or truncated same-version record would otherwise keep an unknown id.
        That leaves the store disagreeing with the painted accent and no swatch looking
        selected, so the id is coerced once, at the boundary, for everything downstream.
      */
      merge: (persisted, current) => {
        const state = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...state,
          theme: isThemeId(state.theme) ? state.theme : DEFAULT_THEME_ID,
          scheme: isScheme(state.scheme) ? state.scheme : DEFAULT_SCHEME,
        };
      },
      /*
        Paint accent and scheme as soon as storage is read. Doing this here rather than in a
        component effect avoids a frame of the wrong theme on reload, and keeps the DOM in
        sync even if no component happens to subscribe.
      */
      onRehydrateStorage: () => (state) => {
        applyTheme(isThemeId(state?.theme) ? state.theme : DEFAULT_THEME_ID);
        applyScheme(isScheme(state?.scheme) ? state.scheme : DEFAULT_SCHEME);
      },
    },
  ),
);
