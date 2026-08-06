import { useMessages } from '../i18n/useMessages.ts';
import { useSettings } from '../store/useSettings.ts';
import { THEMES, type ThemeId } from '../theme/themes.ts';

/**
 * Accent color switcher. Rendered as a radiogroup rather than a `<select>` so the swatches
 * themselves are the choice — the whole point is picking a color you can see.
 */
export const ThemePicker = () => {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const { t } = useMessages();

  /*
    The color names are the swatches' only accessible label, so they are translated here
    rather than in `theme/themes.ts` — that module's `as const` tokens stay pure data.
  */
  const names: Record<ThemeId, string> = {
    leaf: t.themeLeaf,
    ocean: t.themeOcean,
    coral: t.themeCoral,
    plum: t.themePlum,
    sand: t.themeSand,
  };

  return (
    <div
      role="radiogroup"
      aria-label={t.accentColor}
      className="flex items-center gap-1 rounded-lg border border-slate-300 px-1.5 py-1 dark:border-slate-600"
    >
      {THEMES.map((theme_) => {
        const selected = theme === theme_.id;
        const name = names[theme_.id];
        return (
          <button
            key={theme_.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={name}
            title={name}
            onClick={() => setTheme(theme_.id)}
            /*
              The visible dot stays 16px, but the button is padded out to a 24px hit area —
              bare swatches are an awkward tap target on the phone this app is used on.
              `bg-clip-content` keeps the color inside the padding so only the dot shows.
            */
            className={`size-6 rounded-full border-4 border-transparent bg-clip-content ring-offset-1 ring-offset-white transition dark:ring-offset-slate-900 ${
              selected
                ? 'ring-2 ring-slate-900 dark:ring-slate-100'
                : 'ring-0 hover:scale-110'
            }`}
            /* The swatch is data, not a design token — Tailwind can't generate a class per theme. */
            style={{ backgroundColor: theme_.swatch }}
          />
        );
      })}
    </div>
  );
};
