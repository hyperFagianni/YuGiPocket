import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { RARITY_COLORS } from '@/data/rarity';
import type { RarityTier } from '@/types/domain';

function GlowPulse() {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(0.55, { duration: 500 }), withTiming(0.15, { duration: 500 })), 4, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.fill, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="glowRare" cx="50%" cy="50%" r="60%">
            <Stop offset="0%" stopColor={RARITY_COLORS.rare} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={RARITY_COLORS.rare} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill="url(#glowRare)" />
      </Svg>
    </Animated.View>
  );
}

function ShimmerSweep() {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ translateX: -160 + progress.value * 320 }, { rotate: '20deg' }],
  }));

  return (
    <View style={styles.fill} pointerEvents="none">
      <Animated.View style={[styles.sweepBand, { backgroundColor: RARITY_COLORS.superRare }, style]} />
    </View>
  );
}

function RadialBurst() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const flash = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withTiming(1.3, { duration: 400, easing: Easing.out(Easing.cubic) });
    opacity.value = withDelay(150, withTiming(0, { duration: 350 }));
    flash.value = withSequence(withTiming(0.4, { duration: 80 }), withTiming(0, { duration: 220 }));
  }, [scale, opacity, flash]);

  const burstStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  return (
    <View style={styles.fill} pointerEvents="none">
      <Animated.View style={[styles.fill, burstStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <RadialGradient id="glowUltra" cx="50%" cy="50%" r="55%">
              <Stop offset="0%" stopColor="#FFF3D6" stopOpacity={0.95} />
              <Stop offset="45%" stopColor={RARITY_COLORS.ultraRare} stopOpacity={0.7} />
              <Stop offset="100%" stopColor={RARITY_COLORS.ultraRare} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill="url(#glowUltra)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.whiteFlash, flashStyle]} />
    </View>
  );
}

const PARTICLE_COLORS = [RARITY_COLORS.secretRare, RARITY_COLORS.rare, RARITY_COLORS.superRare, RARITY_COLORS.ultraRare];

function Particle({ index, total }: { index: number; total: number }) {
  const progress = useSharedValue(0);
  const angle = (2 * Math.PI * index) / total + (Math.random() - 0.5) * 0.4;
  const distance = 55 + Math.random() * 25;
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];

  React.useEffect(() => {
    progress.value = withDelay(index * 25, withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) }));
  }, [progress, index]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
      { scale: 1 - progress.value * 0.6 },
    ],
  }));

  return <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />;
}

function HoloBurst() {
  const sweepA = useSharedValue(0);
  const sweepB = useSharedValue(1);

  React.useEffect(() => {
    sweepA.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) });
    sweepB.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) });
  }, [sweepA, sweepB]);

  const styleA = useAnimatedStyle(() => ({
    opacity: 1 - sweepA.value,
    transform: [{ translateX: -160 + sweepA.value * 320 }, { rotate: '20deg' }],
  }));
  const styleB = useAnimatedStyle(() => ({
    opacity: sweepB.value,
    transform: [{ translateX: -160 + sweepB.value * 320 }, { rotate: '-20deg' }],
  }));

  const particles = useMemo(() => Array.from({ length: 10 }, (_, i) => i), []);

  return (
    <View style={styles.fill} pointerEvents="none">
      <Animated.View style={[styles.sweepBand, { backgroundColor: RARITY_COLORS.secretRare }, styleA]} />
      <Animated.View style={[styles.sweepBand, { backgroundColor: RARITY_COLORS.rare }, styleB]} />
      <View style={styles.particleOrigin}>
        {particles.map((i) => (
          <Particle key={i} index={i} total={particles.length} />
        ))}
      </View>
    </View>
  );
}

export function RarityRevealEffect({ rarity }: { rarity: RarityTier }) {
  switch (rarity) {
    case 'rare':
      return <GlowPulse />;
    case 'superRare':
      return <ShimmerSweep />;
    case 'ultraRare':
      return <RadialBurst />;
    case 'secretRare':
      return <HoloBurst />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  sweepBand: {
    position: 'absolute',
    top: '-60%',
    width: 90,
    height: '220%',
    opacity: 0.35,
  },
  whiteFlash: {
    backgroundColor: '#FFFFFF',
  },
  particleOrigin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
