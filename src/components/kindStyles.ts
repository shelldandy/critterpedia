import type { Kind } from '../data/types.ts';

/** Backgrounds shared by critter tiles and the kind filter buttons. */
export const KIND_BACKGROUND: Record<Kind, string> = {
  fish: 'bg-sky-100 dark:bg-sky-950',
  bug: 'bg-amber-100 dark:bg-amber-950',
  sea: 'bg-teal-100 dark:bg-teal-950',
};
