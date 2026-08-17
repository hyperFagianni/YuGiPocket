export interface PackTheme {
  frontTexture: number;
  accentColor: string;
}

export const SIDE_TEXTURE = require('../../assets/packs/side.png');

export const PACK_THEMES: Record<string, PackTheme> = {
  lob: {
    frontTexture: require('../../assets/packs/lob-front.png'),
    accentColor: '#1FA9C7',
  },
  mrd: {
    frontTexture: require('../../assets/packs/mrd-front.png'),
    accentColor: '#6C7280',
  },
  rotd: {
    frontTexture: require('../../assets/packs/rotd-front.png'),
    accentColor: '#C1442E',
  },
};
