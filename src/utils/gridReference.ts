/**
 * Grid Reference Converter Utilities
 *
 * Pure-math, fully offline conversion between:
 *   - Decimal Degrees (DD)
 *   - Degrees Minutes Seconds (DMS)
 *   - MGRS (Military Grid Reference System)
 *
 * DD ↔ DMS: direct arithmetic
 * DD ↔ MGRS: via UTM intermediate using WGS84 ellipsoid formulas
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DDCoord {
  lat: number;
  lng: number;
}

export interface DMSResult {
  latDeg: number;
  latMin: number;
  latSec: number;
  latDir: 'N' | 'S';
  lngDeg: number;
  lngMin: number;
  lngSec: number;
  lngDir: 'E' | 'W';
  formatted: string;
}

// ---------------------------------------------------------------------------
// MGRS zone letter lookup table (standard 8° latitude bands, C–X, no I/O)
// ---------------------------------------------------------------------------

const MGRS_ZONE_LETTERS = 'CDEFGHJKLMNPQRSTUVWX';

function getMgrsZoneLetter(lat: number): string {
  if (lat < -80 || lat > 84) {
    throw new Error('Latitude out of valid MGRS range (-80 to 84)');
  }
  const idx = Math.floor((lat + 80) / 8);
  // Clamp to the table length (X band covers 80–84)
  return MGRS_ZONE_LETTERS[Math.min(idx, MGRS_ZONE_LETTERS.length - 1)];
}

// ---------------------------------------------------------------------------
// WGS84 ellipsoid constants
// ---------------------------------------------------------------------------

const a = 6378137.0; // semi-major axis (m)
const f = 1 / 298.257223563; // flattening
const e2 = 2 * f - f * f; // first eccentricity squared
const ePrimeSquared = e2 / (1 - e2); // second eccentricity squared
const k0 = 0.9996; // UTM scale factor

// ---------------------------------------------------------------------------
// DD → UTM
// ---------------------------------------------------------------------------

interface UTMCoord {
  easting: number;
  northing: number;
  zoneNumber: number;
  zoneLetter: string;
}

function ddToUtm(lat: number, lng: number): UTMCoord {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  // UTM zone number
  let zoneNumber = Math.floor((lng + 180) / 6) + 1;
  // Clamp antimeridian edge case: valid UTM zones are 1–60
  if (zoneNumber > 60) zoneNumber = 60;

  // Special zones for Norway / Svalbard
  if (lat >= 56 && lat < 64 && lng >= 3 && lng < 12) zoneNumber = 32;
  if (lat >= 72 && lat < 84) {
    if (lng >= 0 && lng < 9) zoneNumber = 31;
    else if (lng >= 9 && lng < 21) zoneNumber = 33;
    else if (lng >= 21 && lng < 33) zoneNumber = 35;
    else if (lng >= 33 && lng < 42) zoneNumber = 37;
  }

  const lngOriginRad = (((zoneNumber - 1) * 6 - 180 + 3) * Math.PI) / 180;

  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2);
  const T = Math.tan(latRad) ** 2;
  const C = ePrimeSquared * Math.cos(latRad) ** 2;
  const A = Math.cos(latRad) * (lngRad - lngOriginRad);

  // Meridional arc
  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * latRad -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) *
        Math.sin(2 * latRad) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * latRad) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * latRad));

  const easting =
    k0 *
      N *
      (A +
        ((1 - T + C) * A ** 3) / 6 +
        ((5 - 18 * T + T ** 2 + 72 * C - 58 * ePrimeSquared) * A ** 5) / 120) +
    500000;

  let northing =
    k0 *
    (M +
      N *
        Math.tan(latRad) *
        (A ** 2 / 2 +
          ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 +
          ((61 - 58 * T + T ** 2 + 600 * C - 330 * ePrimeSquared) * A ** 6) /
            720));

  if (lat < 0) northing += 10000000; // Southern hemisphere offset

  return {
    easting,
    northing,
    zoneNumber,
    zoneLetter: getMgrsZoneLetter(lat),
  };
}

// ---------------------------------------------------------------------------
// UTM → DD
// ---------------------------------------------------------------------------

function utmToDD(
  easting: number,
  northing: number,
  zoneNumber: number,
  southern: boolean,
): DDCoord {
  const x = easting - 500000;
  let y = northing;
  if (southern) y -= 10000000;

  const lngOrigin = (zoneNumber - 1) * 6 - 180 + 3;
  const lngOriginRad = (lngOrigin * Math.PI) / 180;

  const M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256));

  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) ** 2);
  const T1 = Math.tan(phi1) ** 2;
  const C1 = ePrimeSquared * Math.cos(phi1) ** 2;
  const R1 = (a * (1 - e2)) / (1 - e2 * Math.sin(phi1) ** 2) ** 1.5;
  const D = x / (N1 * k0);

  const lat =
    phi1 -
    ((N1 * Math.tan(phi1)) / R1) *
      (D ** 2 / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * ePrimeSquared) * D ** 4) /
          24 +
        ((61 +
          90 * T1 +
          298 * C1 +
          45 * T1 ** 2 -
          252 * ePrimeSquared -
          3 * C1 ** 2) *
          D ** 6) /
          720);

  const lng =
    lngOriginRad +
    (D -
      ((1 + 2 * T1 + C1) * D ** 3) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * ePrimeSquared + 24 * T1 ** 2) *
        D ** 5) /
        120) /
      Math.cos(phi1);

  return {
    lat: (lat * 180) / Math.PI,
    lng: (lng * 180) / Math.PI,
  };
}

// ---------------------------------------------------------------------------
// MGRS grid constants
// ---------------------------------------------------------------------------

/** Size of one MGRS 100km grid square in meters */
const MGRS_SQUARE_SIZE = 100000;
/** Size of one MGRS northing cycle (20 rows × 100km) in meters */
const MGRS_CYCLE_SIZE = 2000000;
/** Threshold used to detect a cycle boundary mismatch (~1 band height) */
const MGRS_CYCLE_THRESHOLD = 1000000;

// Column sets (repeat every 3 zones)
const COL_SETS = ['ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ'];
// Row sets (repeat every 2 zones)
const ROW_SETS = ['ABCDEFGHJKLMNPQRSTUV', 'FGHJKLMNPQRSTUVABCDE'];

function getMgrsSquareId(
  easting: number,
  northing: number,
  zoneNumber: number,
): string {
  const colSet = COL_SETS[(zoneNumber - 1) % 3];
  const rowSet = ROW_SETS[(zoneNumber - 1) % 2];

  const colIdx = Math.floor(easting / MGRS_SQUARE_SIZE) - 1;
  const rowIdx = Math.floor((northing % MGRS_CYCLE_SIZE) / MGRS_SQUARE_SIZE);

  const col = colSet[colIdx % colSet.length];
  const row = rowSet[rowIdx % rowSet.length];

  return col + row;
}

// ---------------------------------------------------------------------------
// DD → MGRS
// ---------------------------------------------------------------------------

/**
 * Convert Decimal Degrees to MGRS string.
 * @param lat - Latitude in decimal degrees (-80 to 84)
 * @param lng - Longitude in decimal degrees (-180 to 180)
 * @returns MGRS string, e.g. "11S MA 36712 25518"
 */
export function ddToMgrs(lat: number, lng: number): string {
  if (lat < -80 || lat > 84) {
    throw new Error('Latitude out of valid MGRS range (-80 to 84)');
  }
  if (lng < -180 || lng > 180) {
    throw new Error('Longitude out of range (-180 to 180)');
  }

  const utm = ddToUtm(lat, lng);
  const squareId = getMgrsSquareId(utm.easting, utm.northing, utm.zoneNumber);

  const eLocal = Math.floor(utm.easting % MGRS_SQUARE_SIZE)
    .toString()
    .padStart(5, '0');
  const nLocal = Math.floor(utm.northing % MGRS_SQUARE_SIZE)
    .toString()
    .padStart(5, '0');

  return `${utm.zoneNumber}${utm.zoneLetter} ${squareId} ${eLocal} ${nLocal}`;
}

// ---------------------------------------------------------------------------
// MGRS → DD
// ---------------------------------------------------------------------------

/**
 * Convert MGRS string to Decimal Degrees.
 * @param mgrsString - e.g. "11S MA 36712 25518" (spaces optional)
 * @returns { lat, lng } in decimal degrees
 */
export function mgrsToDD(mgrsString: string): DDCoord {
  // Normalize: collapse spaces, uppercase
  const s = mgrsString.replace(/\s+/g, '').toUpperCase();

  // Parse zone number (1–2 digits) + zone letter (1 alpha)
  const match = s.match(/^(\d{1,2})([A-Z])([A-Z]{2})(\d{4,10})$/);
  if (!match) {
    throw new Error(`Invalid MGRS string: "${mgrsString}"`);
  }

  const zoneNumber = parseInt(match[1], 10);
  if (zoneNumber < 1 || zoneNumber > 60) {
    throw new Error(
      `Invalid MGRS zone number: ${zoneNumber}. Must be between 1 and 60.`,
    );
  }
  const zoneLetter = match[2];
  const squareId = match[3]; // 2 letters
  const digits = match[4];

  if (digits.length % 2 !== 0) {
    throw new Error('MGRS numeric part must have an even number of digits');
  }

  const precision = digits.length / 2;
  const eStr = digits.slice(0, precision);
  const nStr = digits.slice(precision);

  // Scale to 1m resolution (5 digits)
  const eFactor = 10 ** (5 - precision);
  const eLocal = parseInt(eStr, 10) * eFactor;
  const nLocal = parseInt(nStr, 10) * eFactor;

  // Recover 100km square easting/northing from square ID
  const colSet = COL_SETS[(zoneNumber - 1) % 3];
  const rowSet = ROW_SETS[(zoneNumber - 1) % 2];

  const colIdx = colSet.indexOf(squareId[0]);
  const rowIdx = rowSet.indexOf(squareId[1]);

  if (colIdx < 0 || rowIdx < 0) {
    throw new Error(`Invalid MGRS 100km square identifier: "${squareId}"`);
  }

  const easting = (colIdx + 1) * MGRS_SQUARE_SIZE + eLocal;

  // Determine which 2000km "cycle" gives a northing ≥ 0
  const zoneLetterIdx = MGRS_ZONE_LETTERS.indexOf(zoneLetter);
  if (zoneLetterIdx < 0) {
    throw new Error(`Invalid MGRS zone letter: "${zoneLetter}"`);
  }

  // Approximate northing at zone band south edge
  const latApprox = -80 + zoneLetterIdx * 8;
  const utmApprox = ddToUtm(latApprox, (zoneNumber - 1) * 6 - 180 + 3);
  const northingApprox = utmApprox.northing;

  // Find the correct 2000km cycle
  const cycle = Math.floor(northingApprox / MGRS_CYCLE_SIZE);
  let northing = cycle * MGRS_CYCLE_SIZE + rowIdx * MGRS_SQUARE_SIZE + nLocal;

  // If result is more than one band (≈800km) below approx, move up one cycle
  if (northingApprox - northing > MGRS_CYCLE_THRESHOLD)
    northing += MGRS_CYCLE_SIZE;

  const southern = zoneLetter < 'N';
  const dd = utmToDD(easting, northing, zoneNumber, southern);

  return dd;
}

// ---------------------------------------------------------------------------
// DD ↔ DMS
// ---------------------------------------------------------------------------

/**
 * Convert Decimal Degrees to DMS (Degrees Minutes Seconds).
 * @param lat - Latitude in decimal degrees
 * @param lng - Longitude in decimal degrees
 * @returns DMSResult with individual components and a formatted string
 */
export function ddToDms(lat: number, lng: number): DMSResult {
  const latAbs = Math.abs(lat);
  const lngAbs = Math.abs(lng);

  const latDeg = Math.floor(latAbs);
  const latMinFull = (latAbs - latDeg) * 60;
  const latMin = Math.floor(latMinFull);
  const latSec = (latMinFull - latMin) * 60;

  const lngDeg = Math.floor(lngAbs);
  const lngMinFull = (lngAbs - lngDeg) * 60;
  const lngMin = Math.floor(lngMinFull);
  const lngSec = (lngMinFull - lngMin) * 60;

  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';

  const formatted =
    `${latDeg}° ${latMin}' ${latSec.toFixed(2)}" ${latDir}, ` +
    `${lngDeg}° ${lngMin}' ${lngSec.toFixed(2)}" ${lngDir}`;

  return {
    latDeg,
    latMin,
    latSec,
    latDir,
    lngDeg,
    lngMin,
    lngSec,
    lngDir,
    formatted,
  };
}

// ---------------------------------------------------------------------------
// DMS → DD
// ---------------------------------------------------------------------------

/**
 * Parse a DMS string into Decimal Degrees.
 *
 * Accepts formats like:
 *   "36° 10' 17.76" N, 115° 8' 20.76" W"
 *   "36 10 17.76 N 115 8 20.76 W"
 *   "36deg 10 17.76 N, 115deg 8 20.76 W"
 *
 * @param dmsString - DMS coordinate string
 * @returns { lat, lng } in decimal degrees
 */
export function dmsToDd(dmsString: string): DDCoord {
  // Normalize: replace degree symbols / "deg" / apostrophes / quotes
  const s = dmsString
    .replace(/°/g, ' ')
    .replace(/deg/gi, ' ')
    .replace(/'/g, ' ')
    .replace(/"/g, ' ')
    .replace(/,/g, ' ')
    .trim();

  // Token pattern: number or direction letter
  const tokens = s.match(/[\d.]+|[NSEWnsew]/g);
  if (!tokens || tokens.length < 8) {
    throw new Error(`Cannot parse DMS string: "${dmsString}"`);
  }

  const latDeg = parseFloat(tokens[0]);
  const latMin = parseFloat(tokens[1]);
  const latSec = parseFloat(tokens[2]);
  const latDir = tokens[3].toUpperCase() as 'N' | 'S';

  const lngDeg = parseFloat(tokens[4]);
  const lngMin = parseFloat(tokens[5]);
  const lngSec = parseFloat(tokens[6]);
  const lngDir = tokens[7].toUpperCase() as 'E' | 'W';

  if (!['N', 'S'].includes(latDir) || !['E', 'W'].includes(lngDir)) {
    throw new Error(`Invalid direction in DMS string: "${dmsString}"`);
  }

  const lat =
    (latDeg + latMin / 60 + latSec / 3600) * (latDir === 'S' ? -1 : 1);
  const lng =
    (lngDeg + lngMin / 60 + lngSec / 3600) * (lngDir === 'W' ? -1 : 1);

  return { lat, lng };
}

// ---------------------------------------------------------------------------
// DD string parser (forgiving)
// ---------------------------------------------------------------------------

/**
 * Parse a Decimal Degrees string into { lat, lng }.
 *
 * Accepts formats like:
 *   "36.1716, -115.1391"
 *   "36.1716° N, 115.1391° W"
 *   "-36.1716 115.1391"
 *
 * @param ddString - DD coordinate string
 * @returns { lat, lng }
 */
export function parseDdString(ddString: string): DDCoord {
  // Strip degree symbols and normalize
  const s = ddString
    .replace(/°/g, ' ')
    .replace(/deg/gi, ' ')
    .replace(/,/g, ' ')
    .trim();

  // Extract numbers and optional direction letters
  const tokens = s.match(/-?[\d.]+|[NSEWnsew]/g);
  if (!tokens || tokens.length < 2) {
    throw new Error(`Cannot parse DD string: "${ddString}"`);
  }

  // Separate numeric tokens from direction tokens
  const numTokens = tokens.filter((t) => !isNaN(parseFloat(t)));
  const dirTokens = tokens
    .filter((t) => /^[NSEWnsew]$/i.test(t))
    .map((t) => t.toUpperCase());

  if (numTokens.length < 2) {
    throw new Error(`Cannot parse DD string: "${ddString}"`);
  }

  let lat = parseFloat(numTokens[0]);
  let lng = parseFloat(numTokens[1]);

  // Direction letters authoritatively determine the sign
  if (dirTokens.includes('N')) lat = Math.abs(lat);
  if (dirTokens.includes('S')) lat = -Math.abs(lat);
  if (dirTokens.includes('E')) lng = Math.abs(lng);
  if (dirTokens.includes('W')) lng = -Math.abs(lng);

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error(`Invalid DD string: "${ddString}"`);
  }

  return { lat, lng };
}
