/**
 * The components' entry point to the catalog: subscribes to the language and returns both
 * the messages and the raw `lang` (needed for the critter-term lookups and name accessor).
 */

import { useSettings } from '../store/useSettings.ts';
import type { Lang } from './lang.ts';
import { messagesFor, type Messages } from './messages.ts';

export const useMessages = (): { t: Messages; lang: Lang } => {
  const lang = useSettings((s) => s.lang);
  return { t: messagesFor(lang), lang };
};
