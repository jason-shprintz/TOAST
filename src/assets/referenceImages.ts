import { ImageSourcePropType } from 'react-native';

/**
 * Centralized asset map for reference module images.
 *
 * Maps entry IDs to their corresponding image assets (SVG or WebP).
 * The UI resolves images at render time using the entry `id` as the key.
 * If no image exists for an entry, the component renders gracefully without one.
 *
 * Format by Content Type:
 * - Knots, tool techniques, step diagrams: SVG (resolution-independent, tiny file size)
 * - Weather conditions, injuries, photographic reference: WebP (~30% smaller than PNG/JPEG)
 */
const referenceImages: Record<string, ImageSourcePropType> = {
  // Knots - All entries have SVG diagrams
  knots_overhand_and_stopper: require('./images/reference/knots/overhand_stopper.svg'),
  knots_square_reef: require('./images/reference/knots/square_reef.svg'),
  knots_sheet_bend: require('./images/reference/knots/sheet_bend.svg'),
  knots_bowline_fixed_loop: require('./images/reference/knots/bowline.svg'),
  knots_round_turn_two_half_hitches: require('./images/reference/knots/round_turn_two_half_hitches.svg'),
  knots_clove_hitch: require('./images/reference/knots/clove_hitch.svg'),
  knots_taut_line_hitch: require('./images/reference/knots/taut_line_hitch.svg'),
  knots_truckers_hitch: require('./images/reference/knots/truckers_hitch.svg'),
  knots_prusik_friction_hitch: require('./images/reference/knots/prusik_friction_hitch.svg'),

  // Tools - Wilderness (High Priority)
  tools_wild_primitive_mallet: require('./images/reference/tools_wilderness/primitive_mallet.svg'),
  tools_wild_pot_hanger_and_tripod: require('./images/reference/tools_wilderness/pot_hanger_tripod.svg'),
  tools_wild_natural_cordage: require('./images/reference/tools_wilderness/natural_cordage.svg'),
  tools_wild_snow_or_brush_sandals: require('./images/reference/tools_wilderness/snow_brush_sandals.svg'),

  // Tools - Home (Medium Priority)
  tools_fixed_blade_knife_basics: require('./images/reference/tools_home/fixed_blade_knife.svg'),
  tools_hatchet_small_axe: require('./images/reference/tools_home/hatchet_small_axe.svg'),
  tools_firestarter_ferro_rod: require('./images/reference/tools_home/firestarter_ferro_rod.svg'),

  // Survival, Health, Weather, Emergency
  // Add entries as images are created
};

export default referenceImages;
