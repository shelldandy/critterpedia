/**
 * UI message catalog.
 *
 * A plain typed object rather than an i18n library: there are two languages and ~60 keys,
 * and `Record<Lang, ...>` gives compile-time exhaustiveness for free — a missing Spanish
 * key is a type error, which is the only guarantee a library would have added here.
 *
 * Spanish is the Mexican (Latin American) variant throughout, matching the critter names
 * sourced from upstream `translations.uSes`. See `scripts/build-data.ts`.
 */

import type { Lang } from './lang.ts';

export interface Messages {
  // Header
  appName: string;
  hemisphere: string;
  north: string;
  south: string;
  overrideTime: string;
  resetToNow: string;
  customTimeNotice: string;

  // Filter bar
  searchLabel: string;
  searchPlaceholder: string;
  scope: string;
  scopeNow: string;
  scopeAll: string;
  kind: string;
  kindAll: string;
  kindFish: string;
  kindBugs: string;
  kindSea: string;
  when: string;
  month: string;
  hour: string;
  current: string;
  any: string;
  close: string;
  hideUnavailable: string;
  customWhenNotice: string;
  filters: string;
  clearFilters: string;
  sort: string;
  shadow: string;
  shadowNote: string;
  whereBugs: string;
  weatherBugs: string;
  colorScheme: string;
  accentColor: string;

  // Card
  badgeFish: string;
  badgeBug: string;
  badgeSea: string;
  shadowPrefix: string;
  bells: string;
  notNow: string;
  lastMonth: string;

  // Sort options
  sortNumber: string;
  sortUrgency: string;
  sortName: string;
  sortPriceDesc: string;
  sortPriceAsc: string;
  sortShadow: string;
  sortRarity: string;

  // Light/dark
  schemeLight: string;
  schemeDark: string;
  schemeSystem: string;

  // Accent colors
  themeLeaf: string;
  themeOcean: string;
  themeCoral: string;
  themePlum: string;
  themeSand: string;

  // Empty states
  emptyFiltered: string;
  emptyNothingNow: string;

  // Availability
  allDay: string;

  // Footer
  dataCredit: string;
  dataLicense: string;

  /* Functions rather than templates: Spanish needs number agreement English does not
     ("1 criatura" vs "2 criaturas"), and a format string cannot express that.

     The two `…Suffix` forms take the count for agreement but do NOT render it — the count is
     rendered separately so it keeps its own emphasis styling. */
  hoursLeftToday: (h: number) => string;
  catchableNowSuffix: (n: number, filtered: boolean) => string;
  critterCountSuffix: (n: number, filtered: boolean) => string;
}

const en: Messages = {
  appName: 'Critter Companion',
  hemisphere: 'Hemisphere',
  north: 'North',
  south: 'South',
  overrideTime: 'Override the current time',
  resetToNow: 'Now',
  customTimeNotice: 'Showing a custom time, not the current one.',

  searchLabel: 'Search critters by name or location',
  searchPlaceholder: 'Search name or location…',
  scope: 'Scope',
  scopeNow: 'Now',
  scopeAll: 'All critters',
  kind: 'Kind',
  kindAll: 'All',
  kindFish: 'Fish',
  kindBugs: 'Bugs',
  kindSea: 'Sea',
  when: 'When',
  month: 'Month',
  hour: 'Hour',
  current: 'Current',
  any: 'Any',
  close: 'Close',
  hideUnavailable: 'Hide unavailable',
  customWhenNotice: 'Showing a custom month and hour, not the current ones.',
  filters: 'Filters',
  clearFilters: 'Clear filters',
  sort: 'Sort',
  shadow: 'Shadow',
  shadowNote: '(fish & sea creatures)',
  whereBugs: 'Where (bugs)',
  weatherBugs: 'Weather (bugs)',
  colorScheme: 'Color scheme',
  accentColor: 'Accent color',

  badgeFish: 'Fish',
  badgeBug: 'Bug',
  badgeSea: 'Sea',
  shadowPrefix: 'Shadow',
  bells: 'bells',
  notNow: 'Not now',
  lastMonth: 'Last month',

  sortNumber: 'Critterpedia order',
  sortUrgency: 'Urgency',
  sortName: 'Name (A–Z)',
  sortPriceDesc: 'Price (high → low)',
  sortPriceAsc: 'Price (low → high)',
  sortShadow: 'Shadow size',
  sortRarity: 'Rarity',

  schemeLight: 'Light',
  schemeDark: 'Dark',
  schemeSystem: 'System',

  themeLeaf: 'Leaf',
  themeOcean: 'Ocean',
  themeCoral: 'Coral',
  themePlum: 'Plum',
  themeSand: 'Sand',

  emptyFiltered: 'No critters match these filters. Try clearing one.',
  emptyNothingNow: 'Nothing is catchable at this hour. Try another time.',

  allDay: 'All day',

  dataCredit: 'Critter data from',
  dataLicense:
    '(CC BY 4.0). Images © Nintendo, used non-commercially. Not affiliated with Nintendo.',

  hoursLeftToday: (h) => `${h}h left today`,
  catchableNowSuffix: (_n, filtered) => `catchable right now${filtered ? ' (filtered)' : ''}`,
  critterCountSuffix: (n, filtered) =>
    `${n === 1 ? 'critter' : 'critters'}${filtered ? ' (filtered)' : ''}`,
};

const es: Messages = {
  appName: 'Compañero de Bichos',
  hemisphere: 'Hemisferio',
  north: 'Norte',
  south: 'Sur',
  overrideTime: 'Cambiar la hora actual',
  resetToNow: 'Ahora',
  customTimeNotice: 'Se muestra una hora personalizada, no la actual.',

  searchLabel: 'Buscar criaturas por nombre o ubicación',
  searchPlaceholder: 'Buscar nombre o ubicación…',
  scope: 'Alcance',
  scopeNow: 'Ahora',
  scopeAll: 'Todas',
  kind: 'Tipo',
  kindAll: 'Todos',
  kindFish: 'Peces',
  kindBugs: 'Bichos',
  kindSea: 'Marinos',
  when: 'Cuándo',
  month: 'Mes',
  hour: 'Hora',
  current: 'Actual',
  any: 'Cualquiera',
  close: 'Cerrar',
  hideUnavailable: 'Ocultar no disponibles',
  customWhenNotice: 'Se muestra un mes y una hora personalizados, no los actuales.',
  filters: 'Filtros',
  clearFilters: 'Quitar filtros',
  sort: 'Ordenar',
  shadow: 'Sombra',
  shadowNote: '(peces y criaturas marinas)',
  whereBugs: 'Dónde (bichos)',
  weatherBugs: 'Clima (bichos)',
  colorScheme: 'Tema de color',
  accentColor: 'Color de acento',

  badgeFish: 'Pez',
  badgeBug: 'Bicho',
  badgeSea: 'Marino',
  shadowPrefix: 'Sombra',
  bells: 'bayas',
  notNow: 'No ahora',
  lastMonth: 'Último mes',

  sortNumber: 'Orden de Critterpedia',
  sortUrgency: 'Urgencia',
  sortName: 'Nombre (A–Z)',
  sortPriceDesc: 'Precio (mayor → menor)',
  sortPriceAsc: 'Precio (menor → mayor)',
  sortShadow: 'Tamaño de sombra',
  sortRarity: 'Rareza',

  schemeLight: 'Claro',
  schemeDark: 'Oscuro',
  schemeSystem: 'Sistema',

  themeLeaf: 'Hoja',
  themeOcean: 'Océano',
  themeCoral: 'Coral',
  themePlum: 'Ciruela',
  themeSand: 'Arena',

  emptyFiltered: 'Ninguna criatura coincide con estos filtros. Prueba quitar uno.',
  emptyNothingNow: 'No hay nada que atrapar a esta hora. Prueba otra hora.',

  allDay: 'Todo el día',

  dataCredit: 'Datos de criaturas de',
  dataLicense:
    '(CC BY 4.0). Imágenes © Nintendo, uso no comercial. Sin afiliación con Nintendo.',

  hoursLeftToday: (h) => `quedan ${h} h hoy`,
  catchableNowSuffix: (n, filtered) =>
    `${n === 1 ? 'disponible' : 'disponibles'} ahora${filtered ? ' (filtrado)' : ''}`,
  critterCountSuffix: (n, filtered) =>
    `${n === 1 ? 'criatura' : 'criaturas'}${filtered ? ' (filtrado)' : ''}`,
};

const CATALOG: Record<Lang, Messages> = { en, es };

export const messagesFor = (lang: Lang): Messages => CATALOG[lang];
