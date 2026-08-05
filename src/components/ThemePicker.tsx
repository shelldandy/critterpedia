import { useSettings } from '../store/useSettings.ts';
import { THEMES } from '../theme/themes.ts';

/**
 * Accent color switcher. Rendered as a radiogroup rather than a `<select>` so the swatches
 * themselves are the choice — the whole point is picking a color you can see.
 */
export const ThemePicker = () => {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);

  return (
    <div
      role="radiogroup"
      aria-label="Accent color"
      className="flex items-center gap-1 rounded-lg border border-slate-300 px-1.5 py-1 dark:border-slate-600"
    >
      {THEMES.map((t) => {
        const selected = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t.label}
            title={t.label}
            onClick={() => setTheme(t.id)}
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
            style={{ backgroundColor: t.swatch }}
          />
        );
      })}
    </div>
  );
};
