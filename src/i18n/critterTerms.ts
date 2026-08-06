/**
 * Spanish for the critter *attribute* text: locations, shadow sizes, speeds, weather.
 *
 * Unlike the names, none of this exists upstream — `translations` in the Norviah data
 * carries names only, for all 14 locales. So every string here is hand-written rather than
 * sourced, which is why each map is keyed by the exact English data value: the English
 * remains the canonical key and a lookup miss falls back to it rather than rendering blank.
 *
 * Wording follows ACNH's Spanish conventions where those are well established (sombra,
 * "Solo con lluvia"). Terms marked REVIEW below are ones I could not verify against the
 * game's own text — they read naturally in Mexican Spanish but may not match Nintendo's
 * exact phrasing. They are flagged rather than silently presented as authoritative.
 */

import type { MovementSpeed, Shadow, Weather, WhereGroup } from '../data/types.ts';
import type { Lang } from './lang.ts';

/**
 * Shadow sizes. ACNH uses a size ramp; `w/Fin` and `Long` describe shape, so they expand
 * to real words rather than transliterating the English abbreviation.
 */
const SHADOW_ES: Readonly<Record<Shadow, string>> = {
  'X-Small': 'Muy pequeña',
  Small: 'Pequeña',
  Medium: 'Mediana',
  Large: 'Grande',
  'X-Large': 'Muy grande',
  'XX-Large': 'Enorme',
  'X-Large w/Fin': 'Muy grande con aleta',
  Long: 'Alargada',
};

const SPEED_ES: Readonly<Record<MovementSpeed, string>> = {
  Stationary: 'Inmóvil',
  'Very slow': 'Muy lenta',
  Slow: 'Lenta',
  Medium: 'Media',
  Fast: 'Rápida',
  'Very fast': 'Muy rápida',
};

const WEATHER_ES: Readonly<Record<Weather, string>> = {
  'Any weather': 'Cualquier clima',
  'Any except rain': 'Salvo con lluvia',
  'Rain only': 'Solo con lluvia',
};

/** Bucketed bug locations — coined in `build-data.ts`, so these have no in-game original. */
const WHERE_GROUP_ES: Readonly<Record<WhereGroup, string>> = {
  Trees: 'Árboles',
  Flowers: 'Flores',
  Ground: 'Suelo',
  Flying: 'Volando',
  Water: 'Agua',
  Special: 'Especial',
};

/**
 * The raw `whereHow` strings, all 32 of them (7 fish water bodies + 25 bug locations).
 *
 * REVIEW: the compound bug locations — especially the trash/turnip one and the
 * "dig where noise is loudest" hint — are descriptive sentences rather than short labels,
 * so the Spanish is a faithful rendering rather than a verified quote from the game.
 */
const WHERE_HOW_ES: Readonly<Record<string, string>> = {
  // Fish / sea water bodies
  Sea: 'Mar',
  'Sea (rainy days)': 'Mar (días de lluvia)',
  River: 'Río',
  'River (clifftop)': 'Río (en lo alto)',
  'River (mouth)': 'Río (desembocadura)',
  Pond: 'Estanque',
  Pier: 'Muelle',

  // Bugs — trees
  'On trees (any kind)': 'En los árboles (cualquiera)',
  'On hardwood/cedar trees': 'En árboles de madera o cedros',
  'On palm trees': 'En las palmeras',
  'On tree stumps': 'En los tocones',
  'Shaking trees': 'Al agitar árboles',
  'Shaking trees (hardwood or cedar only)': 'Al agitar árboles (madera o cedro)',
  'Disguised under trees': 'Camuflado bajo los árboles',

  // Bugs — flowers
  'On flowers': 'En las flores',
  'On white flowers': 'En las flores blancas',
  'Flying near flowers': 'Volando cerca de las flores',
  'Flying near blue/purple/black flowers':
    'Volando cerca de flores azules, moradas o negras',

  // Bugs — ground
  'On the ground': 'En el suelo',
  'Underground (dig where noise is loudest)':
    'Bajo tierra (cava donde el sonido sea más fuerte)',
  'On rocks/bushes': 'En rocas o arbustos',
  'On beach rocks': 'En las rocas de la playa',
  'From hitting rocks': 'Al golpear rocas',
  'Disguised on shoreline': 'Camuflado en la orilla',

  // Bugs — flying
  Flying: 'Volando',
  'Flying near light sources': 'Volando cerca de las luces',

  // Bugs — water
  'On rivers/ponds': 'En ríos o estanques',
  'Flying near water': 'Volando cerca del agua',

  // Bugs — special
  'On villagers': 'Sobre los vecinos',
  'Pushing snowballs': 'Empujando bolas de nieve',
  'On rotten turnips or candy': 'En nabos podridos o dulces',
  'Flying near trash (boots, tires, cans, used fountain fireworks) or rotten turnips':
    'Volando cerca de basura (botas, llantas, latas, fuegos artificiales usados) o nabos podridos',
};

/*
  Each lookup falls back to the English value rather than to an empty string. A missing key
  should degrade to readable English, never to a blank chip that looks like missing data.
*/
const lookup = <T extends string>(
  map: Readonly<Record<string, string>>,
  value: T,
  lang: Lang,
): string => (lang === 'en' ? value : (map[value] ?? value));

export const shadowLabel = (v: Shadow, lang: Lang): string => lookup(SHADOW_ES, v, lang);
export const speedLabel = (v: MovementSpeed, lang: Lang): string =>
  lookup(SPEED_ES, v, lang);
export const weatherLabel = (v: Weather, lang: Lang): string => lookup(WEATHER_ES, v, lang);
export const whereGroupLabel = (v: WhereGroup, lang: Lang): string =>
  lookup(WHERE_GROUP_ES, v, lang);
export const whereHowLabel = (v: string, lang: Lang): string =>
  lookup(WHERE_HOW_ES, v, lang);

/** Exposed so a test can assert the maps stay in sync with the dataset's actual values. */
export const WHERE_HOW_KEYS = Object.keys(WHERE_HOW_ES);
