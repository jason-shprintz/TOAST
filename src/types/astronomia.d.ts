declare module 'astronomia/planetposition' {
  export interface PlanetCoord {
    lon: number;
    lat: number;
    range: number;
  }
  export class Planet {
    constructor(planet: object);
    position(jde: number): PlanetCoord;
    position2000(jde: number): PlanetCoord;
  }
  export function toFK5(lon: number, lat: number, jde: number): PlanetCoord;
}

declare module 'astronomia/apsis' {
  export const EARTH_RADIUS: number;
  export const MOON_RADIUS: number;
  export function meanPerigee(year: number): number;
  export function perigee(year: number): number;
  export function meanApogee(year: number): number;
  export function apogee(year: number): number;
  export function apogeeParallax(year: number): number;
  export function perigeeParallax(year: number): number;
  export function distance(parallax: number): number;
}

declare module 'astronomia/eclipse' {
  export const TYPE: {
    None: number;
    Partial: number;
    Annular: number;
    AnnularTotal: number;
    Penumbral: number;
    Umbral: number;
    Total: number;
  };
  export interface SolarEclipseResult {
    type: number;
    central?: boolean;
    jdeMax?: number;
    magnitude?: number;
    distance?: number;
    umbral?: number;
    penumbral?: number;
  }
  export interface LunarEclipseResult {
    type: number;
    jdeMax?: number;
    magnitude?: number;
    distance?: number;
    umbral?: number;
    penumbral?: number;
    sdTotal?: number;
    sdPartial?: number;
    sdPenumbral?: number;
  }
  export function solar(year: number): SolarEclipseResult;
  export function lunar(year: number): LunarEclipseResult;
}

declare module 'astronomia/elliptic' {
  import { Planet } from 'astronomia/planetposition';
  export function position(
    planet: Planet,
    earth: Planet,
    jde: number,
  ): { ra: number; dec: number };
}

declare module 'astronomia/globe' {
  export class Coord {
    lat: number;
    lon: number;
    constructor(lat?: number, lon?: number);
  }
}

declare module 'astronomia/julian' {
  export const GREGORIAN0JD: number;
  export class Calendar {
    year: number;
    month: number;
    day: number;
    constructor(year: number, month: number, day: number);
    toJD(): number;
    fromJD(jd: number): this;
    toDate(): Date;
  }
  export class CalendarGregorian extends Calendar {}
  export class CalendarJulian extends Calendar {}
  export function CalendarToJD(
    y: number,
    m: number,
    d: number,
    isJulian: boolean,
  ): number;
  export function CalendarGregorianToJD(
    y: number,
    m: number,
    d: number,
  ): number;
  export function CalendarJulianToJD(y: number, m: number, d: number): number;
  export function JDToCalendar(
    jd: number,
    isJulian: boolean,
  ): { year: number; month: number; day: number };
  export function JDToCalendarGregorian(jd: number): {
    year: number;
    month: number;
    day: number;
  };
  export function JDToDate(jd: number): Date;
  export function DateToJD(date: Date): number;
  export function JDEToDate(jde: number): Date;
  export function DateToJDE(date: Date): number;
  export function LeapYearGregorian(y: number): boolean;
  export function LeapYearJulian(y: number): boolean;
  export function JDToMJD(jd: number): number;
  export function MJDToJD(mjd: number): number;
}

declare module 'astronomia/rise' {
  import { Coord } from 'astronomia/globe';
  export interface RiseObj {
    rise: number;
    transit: number;
    set: number;
  }
  export const Stdh0Stellar: number;
  export const Stdh0Solar: number;
  export const Stdh0LunarMean: number;
  export function approxTimes(
    p: Coord,
    h0: number,
    Th0: number,
    α: number,
    δ: number,
  ): RiseObj;
  export function times(
    p: Coord,
    ΔT: number,
    h0: number,
    Th0: number,
    α3: number[],
    δ3: number[],
  ): RiseObj;
}

declare module 'astronomia/sidereal' {
  export function mean(jd: number): number;
  export function mean0UT(jd: number): number;
  export function apparent(jd: number): number;
  export function apparent0UT(jd: number): number;
}

declare module 'astronomia/solstice' {
  import { Planet } from 'astronomia/planetposition';
  export function march(y: number): number;
  export function june(y: number): number;
  export function september(y: number): number;
  export function december(y: number): number;
  export function march2(year: number, planet: Planet): number;
  export function june2(year: number, planet: Planet): number;
  export function september2(year: number, planet: Planet): number;
  export function december2(year: number, planet: Planet): number;
  export function longitude(year: number, planet: Planet, lon: number): number;
}

declare module 'astronomia/data/vsop87Bearth' {
  const data: object;
  export default data;
}

declare module 'astronomia/data/vsop87Bjupiter' {
  const data: object;
  export default data;
}

declare module 'astronomia/data/vsop87Bmars' {
  const data: object;
  export default data;
}

declare module 'astronomia/data/vsop87Bsaturn' {
  const data: object;
  export default data;
}

declare module 'astronomia/data/vsop87Bvenus' {
  const data: object;
  export default data;
}
