import type { ImageSourcePropType } from 'react-native';

/**
 * App-wide backdrop image — a wide, dark photograph of St. Peter's Basilica that
 * sits behind every screen under a navy scrim.
 *
 * Currently a CC0 (public-domain) "blue hour" photo bundled at
 * `assets/images/basilica.jpg`. Swap that file (or point this at a
 * `{ uri: 'https://…' }`) to change it; set to `null` to fall back to the plain
 * navy ground with a gold glow.
 */
export const BACKDROP_SOURCE: ImageSourcePropType | null = require('@/assets/images/basilica.jpg');

/**
 * Photo credit, shown on the About screen — religious imagery should carry
 * attribution, not be used as bare decoration. (CC0 waives the requirement, but
 * crediting the photographer is still the right thing to do.)
 */
export const BACKDROP_CREDIT: string | null =
  'St. Peter’s Basilica — photo by Jebulon (CC0), via Wikimedia Commons';
