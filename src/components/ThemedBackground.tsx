import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Polygon, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';

const TILE = 160;

/** Sagoma semplificata di un disco da duello: un disco con una lama a ventaglio. */
function DuelDiskMotif({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Circle cx={x} cy={y} r={11} stroke={Colors.text} strokeWidth={1.4} fill="none" />
      <Path
        d={`M ${x + 8} ${y - 3} L ${x + 26} ${y - 10} L ${x + 26} ${y + 4} Z`}
        stroke={Colors.text}
        strokeWidth={1.4}
        fill="none"
      />
    </>
  );
}

/** Piramide stilizzata con un piccolo sole/geroglifico sopra. */
function HieroglyphMotif({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Polygon
        points={`${x},${y - 14} ${x - 13},${y + 8} ${x + 13},${y + 8}`}
        stroke={Colors.text}
        strokeWidth={1.4}
        fill="none"
      />
      <Circle cx={x} cy={y - 24} r={4} stroke={Colors.text} strokeWidth={1.4} fill="none" />
    </>
  );
}

/** Occhio di Horus stilizzato, motivo egizio generico. */
function EyeOfHorusMotif({ x, y }: { x: number; y: number }) {
  return (
    <Path
      d={`M ${x - 14} ${y}
          Q ${x - 4} ${y - 9} ${x + 10} ${y}
          Q ${x - 4} ${y + 7} ${x - 14} ${y} Z
          M ${x + 10} ${y} L ${x + 17} ${y - 2}
          M ${x + 2} ${y + 5} L ${x - 1} ${y + 13} L ${x - 6} ${y + 13}
          M ${x - 14} ${y} L ${x - 20} ${y + 2}`}
      stroke={Colors.text}
      strokeWidth={1.3}
      fill="none"
    />
  );
}

/** Stella di Livello a 5 punte + un piccolo scudo (richiamo ATK/DEF). */
function LevelStarMotif({ x, y }: { x: number; y: number }) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? 9 : 4;
    return `${x + r * Math.cos(angle)},${y + r * Math.sin(angle)}`;
  }).join(' ');
  return <Polygon points={points} stroke={Colors.text} strokeWidth={1.3} fill="none" />;
}

export function ThemedBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <Pattern id="ygpMotifs" width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          <DuelDiskMotif x={28} y={30} />
          <HieroglyphMotif x={122} y={42} />
          <EyeOfHorusMotif x={40} y={108} />
          <LevelStarMotif x={128} y={128} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#ygpMotifs)" opacity={0.07} />
    </Svg>
  );
}
