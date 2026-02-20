import React from 'react';
import { SvgProps } from 'react-native-svg';
// Import SVG components directly
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
import SnowBrushSandals from './images/reference/tools_wilderness/snow_brush_sandals.svg';

/**
 * Centralized asset map for reference module images.
 *
 * Maps entry IDs to their corresponding SVG components.
 * The UI resolves images at render time using the entry `id` as the key.
 * If no image exists for an entry, the component renders gracefully without one.
 *
 * Format by Content Type:
 * - Knots, tool techniques, step diagrams: SVG (resolution-independent, tiny file size)
 * - Weather conditions, injuries, photographic reference: WebP (~30% smaller than PNG/JPEG)
 */
const referenceImages: Record<string, React.FC<SvgProps>> = {
  // Knots - All entries have SVG diagrams
  knots_overhand_and_stopper: OverhandStopper,
  knots_square_reef: SquareReef,
  knots_sheet_bend: SheetBend,
  knots_bowline_fixed_loop: BowlineKnot,
  knots_round_turn_two_half_hitches: RoundTurnTwoHalfHitches,
  knots_clove_hitch: CloveHitch,
  knots_taut_line_hitch: TautLineHitch,
  knots_truckers_hitch: TruckersHitch,
  knots_prusik_friction_hitch: PrusikFrictionHitch,

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
