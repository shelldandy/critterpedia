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
  kind: string;
  kindAll: string;
  kindFish: string;
  kindBugs: string;
  kindSea: string;
  month: string;
  hour: string;
  close: string;
  seasonal: string;
  newThisMonth: string;
  leavingThisMonth: string;
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
  closingSoonNote: string;
  leavingThisMonthNote: string;

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
  critterCountSuffix: (n: number, filtered: boolean) => string;
}

const en: Messages = {
  appName: 'Critter Companion',
  hemisphere: 'Hemisphere',
  north: 'North',
  south: 'South',
  overrideTime: 'Choose a month',
  resetToNow: 'Now',
  customTimeNotice: 'Showing a custom month, not the current one.',

  searchLabel: 'Search critters by name or location',
  searchPlaceholder: 'Search name or location…',
  kind: 'Kind',
  kindAll: 'All',
  kindFish: 'Fish',
  kindBugs: 'Bugs',
  kindSea: 'Sea',
  month: 'Month',
  hour: 'Hour',
  close: 'Close',
  seasonal: 'Seasonal',
  newThisMonth: 'New this month',
  leavingThisMonth: 'Leaving this month',
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
  closingSoonNote: 'Closes within 3 hours today',
  leavingThisMonthNote: 'Leaves at the end of this month',

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
  critterCountSuffix: (n, filtered) =>
    `${n === 1 ? 'critter' : 'critters'}${filtered ? ' (filtered)' : ''}`,
};

const es: Messages = {
  appName: 'Compañero de Bichos',
  hemisphere: 'Hemisferio',
  north: 'Norte',
  south: 'Sur',
  overrideTime: 'Elegir un mes',
  resetToNow: 'Ahora',
  customTimeNotice: 'Se muestra un mes personalizado, no el mes actual.',

  searchLabel: 'Buscar criaturas por nombre o ubicación',
  searchPlaceholder: 'Buscar nombre o ubicación…',
  kind: 'Tipo',
  kindAll: 'Todos',
  kindFish: 'Peces',
  kindBugs: 'Bichos',
  kindSea: 'Marinos',
  month: 'Mes',
  hour: 'Hora',
  close: 'Cerrar',
  seasonal: 'Temporada',
  newThisMonth: 'Nuevas este mes',
  leavingThisMonth: 'Se van este mes',
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
  closingSoonNote: 'Cierra en menos de 3 horas hoy',
  leavingThisMonthNote: 'Se va al final de este mes',

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
  critterCountSuffix: (n, filtered) =>
    `${n === 1 ? 'criatura' : 'criaturas'}${filtered ? ' (filtrado)' : ''}`,
};

const CATALOG: Record<Lang, Messages> = { en, es };

export const messagesFor = (lang: Lang): Messages => CATALOG[lang];
