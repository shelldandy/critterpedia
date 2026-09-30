import { iconUrl } from '../data/critters.ts';
import type { SelectedCritter } from '../domain/filters.ts';
import { nameIn } from '../i18n/lang.ts';
import { useMessages } from '../i18n/useMessages.ts';
import { IconWithFallback } from './IconWithFallback.tsx';

const KIND_STYLE: Record<string, string> = {
  fish: 'bg-sky-100 dark:bg-sky-950',
  bug: 'bg-amber-100 dark:bg-amber-950',
  sea: 'bg-teal-100 dark:bg-teal-950',
};

export const CritterTile = ({
  item,
  isLive,
  onSelect,
}: {
  item: SelectedCritter;
  isLive: boolean;
  onSelect: () => void;
}) => {
  const { lang } = useMessages();
  const name = nameIn(item.critter, lang);
  const { closingSoon, leavingThisMonth } = item;
  const urgencyDot =
    isLive && item.available
      ? closingSoon
        ? 'bg-rose-500'
        : leavingThisMonth
          ? 'bg-orange-500'
          : undefined
      : undefined;

  return (
    <button
      type="button"
      aria-label={name}
      title={name}
      onClick={onSelect}
      className={`relative flex aspect-square w-full items-center justify-center rounded-md border border-slate-200 p-1.5 transition hover:border-accent-600 hover:bg-slate-50 focus:ring-2 focus:ring-accent-600 focus:outline-none dark:border-slate-700 dark:hover:bg-slate-900 ${KIND_STYLE[item.critter.kind]} ${item.available ? '' : 'opacity-35 grayscale'}`}
    >
      <IconWithFallback src={iconUrl(item.critter)} alt="" className="size-full object-contain" />
      {urgencyDot && (
        <span
          aria-hidden
          className={`absolute top-1 right-1 size-2 rounded-full ring-2 ring-white dark:ring-slate-900 ${urgencyDot}`}
        />
      )}
    </button>
  );
};
