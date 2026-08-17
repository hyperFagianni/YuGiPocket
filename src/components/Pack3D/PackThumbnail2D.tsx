import React from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';

import { Radius } from '@/constants/theme';
import { PACK_THEMES } from '@/data/packThemes';

interface Props {
  setId: string;
  onPress: () => void;
  size?: number;
}

export function PackThumbnail2D({ setId, onPress, size = 220 }: Props) {
  const theme = PACK_THEMES[setId];
  if (!theme) return null;
  const height = size * (10 / 7);
  return (
    <Pressable onPress={onPress} style={[styles.wrapper, { width: size, height }]}>
      <Image source={theme.frontTexture} style={[styles.image, { width: size, height }]} resizeMode="cover" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    transform: [{ perspective: 800 }, { rotateY: '18deg' }],
    opacity: 0.85,
  },
  image: {
    borderRadius: Radius.md,
  },
});
