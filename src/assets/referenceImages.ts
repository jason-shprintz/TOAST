import React from 'react';
import { SvgProps } from 'react-native-svg';
// Import SVG components directly
import BowlineKnot from './images/reference/knots/bowline.svg';
import BowlineStep1 from './images/reference/knots/bowline_step1.svg';
import BowlineStep2 from './images/reference/knots/bowline_step2.svg';
import BowlineStep3 from './images/reference/knots/bowline_step3.svg';
import BowlineStep4 from './images/reference/knots/bowline_step4.svg';
import CloveHitch from './images/reference/knots/clove_hitch.svg';
import CloveHitchStep1 from './images/reference/knots/clove_hitch_step1.svg';
import CloveHitchStep2 from './images/reference/knots/clove_hitch_step2.svg';
import CloveHitchStep3 from './images/reference/knots/clove_hitch_step3.svg';
import OverhandStopper from './images/reference/knots/overhand_stopper.svg';
import OverhandStopperStep1 from './images/reference/knots/overhand_stopper_step1.svg';
import OverhandStopperStep2 from './images/reference/knots/overhand_stopper_step2.svg';
import OverhandStopperStep3 from './images/reference/knots/overhand_stopper_step3.svg';
import PrusikFrictionHitch from './images/reference/knots/prusik_friction_hitch.svg';
import PrusikStep1 from './images/reference/knots/prusik_step1.svg';
import PrusikStep2 from './images/reference/knots/prusik_step2.svg';
import PrusikStep3 from './images/reference/knots/prusik_step3.svg';
import PrusikStep4 from './images/reference/knots/prusik_step4.svg';
import RoundTurnTwoHalfHitches from './images/reference/knots/round_turn_two_half_hitches.svg';
import RoundTurnStep1 from './images/reference/knots/round_turn_two_half_hitches_step1.svg';
import RoundTurnStep2 from './images/reference/knots/round_turn_two_half_hitches_step2.svg';
import RoundTurnStep3 from './images/reference/knots/round_turn_two_half_hitches_step3.svg';
import RoundTurnStep4 from './images/reference/knots/round_turn_two_half_hitches_step4.svg';
import SheetBend from './images/reference/knots/sheet_bend.svg';
import SheetBendStep1 from './images/reference/knots/sheet_bend_step1.svg';
import SheetBendStep2 from './images/reference/knots/sheet_bend_step2.svg';
import SheetBendStep3 from './images/reference/knots/sheet_bend_step3.svg';
import SheetBendStep4 from './images/reference/knots/sheet_bend_step4.svg';
import SquareReef from './images/reference/knots/square_reef.svg';
import SquareReefStep1 from './images/reference/knots/square_reef_step1.svg';
import SquareReefStep2 from './images/reference/knots/square_reef_step2.svg';
import SquareReefStep3 from './images/reference/knots/square_reef_step3.svg';
import SquareReefStep4 from './images/reference/knots/square_reef_step4.svg';
import TautLineHitch from './images/reference/knots/taut_line_hitch.svg';
import TautLineStep1 from './images/reference/knots/taut_line_hitch_step1.svg';
import TautLineStep2 from './images/reference/knots/taut_line_hitch_step2.svg';
import TautLineStep3 from './images/reference/knots/taut_line_hitch_step3.svg';
import TautLineStep4 from './images/reference/knots/taut_line_hitch_step4.svg';
import TruckersHitch from './images/reference/knots/truckers_hitch.svg';
import TruckersHitchStep1 from './images/reference/knots/truckers_hitch_step1.svg';
import TruckersHitchStep2 from './images/reference/knots/truckers_hitch_step2.svg';
import TruckersHitchStep3 from './images/reference/knots/truckers_hitch_step3.svg';
import TruckersHitchStep4 from './images/reference/knots/truckers_hitch_step4.svg';
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
 * Maps entry IDs (and step keys) to their corresponding SVG components.
 * The UI resolves images at render time using the entry `id` as the key.
 * For knot entries with multi-step carousels, each step key maps here.
 * If no image exists for an entry, the component renders gracefully without one.
 *
 * Format by Content Type:
 * - Knots, tool techniques, step diagrams: SVG (resolution-independent, tiny file size)
 * - Weather conditions, injuries, photographic reference: WebP (~30% smaller than PNG/JPEG)
 */
const referenceImages: Record<string, React.FC<SvgProps>> = {
  // Knots - legacy single-image keys (kept for backward compatibility)
  knots_overhand_and_stopper: OverhandStopper,
  knots_square_reef: SquareReef,
  knots_sheet_bend: SheetBend,
  knots_bowline_fixed_loop: BowlineKnot,
  knots_round_turn_two_half_hitches: RoundTurnTwoHalfHitches,
  knots_clove_hitch: CloveHitch,
  knots_taut_line_hitch: TautLineHitch,
  knots_truckers_hitch: TruckersHitch,
  knots_prusik_friction_hitch: PrusikFrictionHitch,

  // Knots - step-by-step carousel images
  knots_overhand_stopper_step1: OverhandStopperStep1,
  knots_overhand_stopper_step2: OverhandStopperStep2,
  knots_overhand_stopper_step3: OverhandStopperStep3,

  knots_square_reef_step1: SquareReefStep1,
  knots_square_reef_step2: SquareReefStep2,
  knots_square_reef_step3: SquareReefStep3,
  knots_square_reef_step4: SquareReefStep4,

  knots_sheet_bend_step1: SheetBendStep1,
  knots_sheet_bend_step2: SheetBendStep2,
  knots_sheet_bend_step3: SheetBendStep3,
  knots_sheet_bend_step4: SheetBendStep4,

  knots_bowline_step1: BowlineStep1,
  knots_bowline_step2: BowlineStep2,
  knots_bowline_step3: BowlineStep3,
  knots_bowline_step4: BowlineStep4,

  knots_round_turn_two_half_hitches_step1: RoundTurnStep1,
  knots_round_turn_two_half_hitches_step2: RoundTurnStep2,
  knots_round_turn_two_half_hitches_step3: RoundTurnStep3,
  knots_round_turn_two_half_hitches_step4: RoundTurnStep4,

  knots_clove_hitch_step1: CloveHitchStep1,
  knots_clove_hitch_step2: CloveHitchStep2,
  knots_clove_hitch_step3: CloveHitchStep3,

  knots_taut_line_hitch_step1: TautLineStep1,
  knots_taut_line_hitch_step2: TautLineStep2,
  knots_taut_line_hitch_step3: TautLineStep3,
  knots_taut_line_hitch_step4: TautLineStep4,

  knots_truckers_hitch_step1: TruckersHitchStep1,
  knots_truckers_hitch_step2: TruckersHitchStep2,
  knots_truckers_hitch_step3: TruckersHitchStep3,
  knots_truckers_hitch_step4: TruckersHitchStep4,

  knots_prusik_step1: PrusikStep1,
  knots_prusik_step2: PrusikStep2,
  knots_prusik_step3: PrusikStep3,
  knots_prusik_step4: PrusikStep4,

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
