import { LANGS } from '../i18n/lang.ts';
import { useSettings } from '../store/useSettings.ts';

/**
 * Critter-name language switch, styled to match the scheme control beside it.
 *
 * Labelled "Critter names" rather than "Language" on purpose: the UI chrome stays English,
 * and a control promising to translate the whole app would be over-claiming.
 */
export const LangPicker = () => {
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);

  return (
    <div
      role="group"
      /* Self-labelling in both languages, like the per-button titles: this control must stay
         findable regardless of which language is active. */
      aria-label="Critter name language / Idioma de los nombres"
      className="flex overflow-hidden rounded-lg border border-slate-300 text-xs dark:border-slate-600"
    >
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          aria-pressed={lang === l.id}
          title={l.title}
          onClick={() => setLang(l.id)}
          className={`px-2 py-1.5 font-medium ${
            lang === l.id
              ? 'bg-accent-600 text-white'
              : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};
