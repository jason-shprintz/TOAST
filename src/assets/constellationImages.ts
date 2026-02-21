import React from 'react';
import { SvgProps } from 'react-native-svg';
import Cassiopeia from './images/constellations/cassiopeia.svg';
import CruxSouthernCross from './images/constellations/crux_southern_cross.svg';
import OrionsBelt from './images/constellations/orions_belt.svg';
import Scorpius from './images/constellations/scorpius.svg';
import UrsaMajorBigDipper from './images/constellations/ursa_major_big_dipper.svg';

/**
 * Maps constellation imageKey values (from CONSTELLATION_GUIDES) to their
 * corresponding SVG diagram components.
 */
const constellationImages: Record<string, React.FC<SvgProps>> = {
  ursa_major_big_dipper: UrsaMajorBigDipper,
  cassiopeia: Cassiopeia,
  orions_belt: OrionsBelt,
  crux_southern_cross: CruxSouthernCross,
  scorpius: Scorpius,
};

export default constellationImages;
