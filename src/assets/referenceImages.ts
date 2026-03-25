import React from 'react';
import { SvgProps } from 'react-native-svg';
import BowlineKnot from './images/reference/knots/bowline.svg';
import CloveHitch from './images/reference/knots/clove_hitch.svg';
import OverhandStopper from './images/reference/knots/overhand_stopper.svg';
import PrusikFrictionHitch from './images/reference/knots/prusik_friction_hitch.svg';
import RoundTurnTwoHalfHitches from './images/reference/knots/round_turn_two_half_hitches.svg';
import SheetBend from './images/reference/knots/sheet_bend.svg';
import SquareReef from './images/reference/knots/square_reef.svg';
import TautLineHitch from './images/reference/knots/taut_line_hitch.svg';
import TruckersHitch from './images/reference/knots/truckers_hitch.svg';
import FirestarterFerroRod from './images/reference/tools_home/firestarter_ferro_rod.svg';
import FixedBladeKnife from './images/reference/tools_home/fixed_blade_knife.svg';
import HatchetSmallAxe from './images/reference/tools_home/hatchet_small_axe.svg';
import NaturalCordage from './images/reference/tools_wilderness/natural_cordage.svg';
import PotHangerTripod from './images/reference/tools_wilderness/pot_hanger_tripod.svg';
import PrimitiveMallet from './images/reference/tools_wilderness/primitive_mallet.svg';
// eslint-disable-next-line import/order
import SnowBrushSandals from './images/reference/tools_wilderness/snow_brush_sandals.svg';

/**
 * KnotImageSource represents either a high-quality static image (WebP from
 * Wikimedia Commons, loaded via require()) or a fallback SVG component.
 *
 * - 'static': use with React Native <Image source={source.value} />
 * - 'svg': use as <SvgComponent width="100%" height={200} />
 */
export type KnotImageSource =
  | { type: 'static'; value: number }
  | { type: 'svg'; value: React.FC<SvgProps> };

/**
 * High-quality Wikimedia Commons knot images (WebP).
 *
 * These files live at src/assets/images/reference/knots/<name>.webp
 * Run `node scripts/download-knot-images.js` to fetch and convert them.
 *
 * Metro requires static string literals in require() calls and will fail at
 * bundle time if a required file does not exist on disk. Only uncomment an
 * entry once the corresponding file has been downloaded and committed.
 * Missing entries fall back to the SVG defined in svgKnotImages below.
 */
const bowlineWebp: number = require('./images/reference/knots/bowline.webp');

const wikiKnotImages: Record<string, number | null> = {
  knots_bowline_fixed_loop: bowlineWebp,
  knots_clove_hitch: null, // run download-knot-images.js
  knots_sheet_bend: null, // run download-knot-images.js
  knots_square_reef: null, // run download-knot-images.js
  knots_overhand_and_stopper: null, // run download-knot-images.js
  knots_round_turn_two_half_hitches: null, // run download-knot-images.js
  knots_taut_line_hitch: null, // run download-knot-images.js
  knots_truckers_hitch: null, // run download-knot-images.js
  knots_prusik_friction_hitch: null, // run download-knot-images.js
};

/** SVG fallbacks for all knots (used when WebP is not yet available) */
const svgKnotImages: Record<string, React.FC<SvgProps>> = {
  knots_bowline_fixed_loop: BowlineKnot,
  knots_clove_hitch: CloveHitch,
  knots_sheet_bend: SheetBend,
  knots_square_reef: SquareReef,
  knots_overhand_and_stopper: OverhandStopper,
  knots_round_turn_two_half_hitches: RoundTurnTwoHalfHitches,
  knots_taut_line_hitch: TautLineHitch,
  knots_truckers_hitch: TruckersHitch,
  knots_prusik_friction_hitch: PrusikFrictionHitch,
};

/**
 * Resolve an image key to its best available source.
 *
 * Priority: Wikimedia WebP > SVG fallback > null
 *
 * Used by KnotStepCarousel and any component that needs to display a knot image.
 */
export function getKnotImage(key: string): KnotImageSource | null {
  const staticSrc = wikiKnotImages[key];
  if (staticSrc != null) {
    return { type: 'static', value: staticSrc };
  }
  const svgSrc = svgKnotImages[key];
  if (svgSrc) {
    return { type: 'svg', value: svgSrc };
  }
  return null;
}

/**
 * Legacy map of SVG components for non-knot reference images (tools, etc.).
 * Used by EntryScreen and other components that render a single SVG.
 *
 * Format by Content Type:
 * - Knots: use getKnotImage() above
 * - Tool techniques, step diagrams: SVG (resolution-independent, tiny file size)
 * - Weather conditions, injuries, photographic reference: WebP (~30% smaller than PNG/JPEG)
 */
const referenceImages: Record<string, React.FC<SvgProps>> = {
  // Tools - Wilderness (High Priority)
  tools_wild_primitive_mallet: PrimitiveMallet,
  tools_wild_pot_hanger_and_tripod: PotHangerTripod,
  tools_wild_natural_cordage: NaturalCordage,
  tools_wild_snow_or_brush_sandals: SnowBrushSandals,

  // Tools - Home (Medium Priority)
  tools_fixed_blade_knife_basics: FixedBladeKnife,
  tools_hatchet_small_axe: HatchetSmallAxe,
  tools_firestarter_ferro_rod: FirestarterFerroRod,

  // Survival, Health, Weather, Emergency
  // Add entries as images are created
};

export default referenceImages;
