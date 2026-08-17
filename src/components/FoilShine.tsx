import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { RARITY_COLORS } from '@/data/rarity';
import type { RarityTier } from '@/types/domain';

interface TierConfig {
  colors: readonly [string, string, ...string[]];
  durationMs: number;
  opacity: number;
  angleDeg: number;
  crossed?: boolean;
}

const TIER_CONFIG: Partial<Record<RarityTier, TierConfig>> = {
  rare: { colors: ['transparent', `${RARITY_COLORS.rare}55`, 'transparent'], durationMs: 4000, opacity: 0.6, angleDeg: 20 },
  superRare: {
    colors: ['transparent', `${RARITY_COLORS.superRare}66`, 'transparent'],
    durationMs: 2500,
    opacity: 0.75,
    angleDeg: 20,
  },
  ultraRare: {
    colors: ['transparent', `${RARITY_COLORS.ultraRare}77`, '#FFFFFFAA', `${RARITY_COLORS.ultraRare}77`, 'transparent'],
    durationMs: 1800,
    opacity: 0.85,
    angleDeg: 20,
  },
  secretRare: {
    colors: ['transparent', '#C96BFF88', '#4F8CFF88', '#3FD0C988', 'transparent'],
    durationMs: 1200,
    opacity: 0.9,
    angleDeg: 20,
    crossed: true,
  },
};

function Sweep({ width, height, config, reverse }: { width: number; height: number; config: TierConfig; reverse?: boolean }) {
  const progress = useSharedValue(reverse ? 1 : 0);

  React.useEffect(() => {
    progress.value = reverse ? 1 : 0;
    progress.value = withRepeat(
      withTiming(reverse ? 0 : 1, { duration: config.durationMs, easing: Easing.linear }),
      -1,
      false,
    );
    // config identity is stable per rarity tier, only re-run if the tier config itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, reverse]);

  const span = width * 1.6;
  const startX = -span;
  const endX = width + span;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + progress.value * (endX - startX) },
      { rotate: `${reverse ? -config.angleDeg : config.angleDeg}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sweepWrapper,
        { width: span, height: height * 2.2, opacity: config.opacity },
        animatedStyle,
      ]}>
      <LinearGradient colors={config.colors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

interface Props {
  rarity: RarityTier;
  children: React.ReactNode;
  style?: object;
}

export function FoilShine({ rarity, children, style }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const config = TIER_CONFIG[rarity];

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  }

  if (!config) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {children}
      {size.width > 0 && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Sweep width={size.width} height={size.height} config={config} />
          {config.crossed && <Sweep width={size.width} height={size.height} config={config} reverse />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  sweepWrapper: {
    position: 'absolute',
    top: '-60%',
  },
});
