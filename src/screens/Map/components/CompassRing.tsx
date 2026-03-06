import React, { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

// Cardinal labels and their degree positions around the ring
const CARDINALS = [
  { label: 'N', deg: 0 },
  { label: 'NE', deg: 45 },
  { label: 'E', deg: 90 },
  { label: 'SE', deg: 135 },
  { label: 'S', deg: 180 },
  { label: 'SW', deg: 225 },
  { label: 'W', deg: 270 },
  { label: 'NW', deg: 315 },
];

// 24 ticks every 15°; major ticks coincide with the 8 cardinals
const TICKS = Array.from({ length: 24 }, (_, i) => {
  const deg = i * 15;
  return { deg, isMajor: deg % 45 === 0 };
});

type Props = {
  ringSpin: Animated.AnimatedInterpolation<string>;
  labelSpin: Animated.AnimatedInterpolation<string>;
};

export default function CompassRing({ ringSpin, labelSpin }: Props) {
  const COLORS = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  return (
    <View style={styles.compassRing}>
      {/* Rotating ring — cardinals spin opposite to heading */}
      <Animated.View
        style={[styles.cardinalRing, { transform: [{ rotate: ringSpin }] }]}
      >
        {TICKS.map(({ deg, isMajor }) => {
          const rad = (deg * Math.PI) / 180;
          const r = isMajor ? 49 : 50.5;
          const tx = Math.sin(rad) * r;
          const ty = -Math.cos(rad) * r;
          const hw = isMajor ? 1 : 0.75; // half-width
          const hh = isMajor ? 4 : 2.5; // half-height
          return (
            <View
              key={`tick-${deg}`}
              style={[
                isMajor ? styles.tickMajor : styles.tickMinor,
                {
                  transform: [
                    { translateX: tx - hw },
                    { translateY: ty - hh },
                    { rotate: `${deg}deg` },
                  ],
                },
              ]}
            />
          );
        })}
        {CARDINALS.map(({ label, deg }) => {
          const rad = (deg * Math.PI) / 180;
          const radius = 38;
          const x = Math.sin(rad) * radius;
          const y = -Math.cos(rad) * radius;
          const isNorth = label === 'N';
          return (
            <Animated.Text
              key={label}
              style={[
                isNorth ? styles.cardinalLabelNorth : styles.cardinalLabel,
                {
                  transform: [
                    { translateX: x - 7 },
                    { translateY: y - 8 },
                    { rotate: labelSpin },
                  ],
                },
              ]}
            >
              {label}
            </Animated.Text>
          );
        })}
      </Animated.View>

      {/* Fixed needle — always points up */}
      <View style={styles.needleWrapper}>
        <View style={styles.needleNorth} />
        <View style={styles.needleSouth} />
      </View>

      {/* Center pivot dot */}
      <View style={styles.pivot} />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    compassRing: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 2,
      borderColor: colors.SECONDARY_ACCENT,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    cardinalRing: {
      position: 'absolute',
      width: 110,
      height: 110,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tickMajor: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 2,
      height: 8,
      borderRadius: 1,
      backgroundColor: colors.SECONDARY_ACCENT,
    },
    tickMinor: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 1.5,
      height: 5,
      borderRadius: 1,
      backgroundColor: colors.PRIMARY_DARK,
      opacity: 0.4,
    },
    cardinalLabel: {
      position: 'absolute',
      fontSize: 11,
      top: '50%',
      left: '50%',
      color: colors.PRIMARY_DARK,
      fontWeight: '400',
    },
    cardinalLabelNorth: {
      position: 'absolute',
      fontSize: 11,
      top: '50%',
      left: '50%',
      color: colors.ERROR,
      fontWeight: '700',
    },
    needleWrapper: {
      width: 6,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    needleNorth: {
      width: 6,
      height: 24,
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
      backgroundColor: colors.ERROR,
    },
    needleSouth: {
      width: 6,
      height: 24,
      borderBottomLeftRadius: 3,
      borderBottomRightRadius: 3,
      backgroundColor: colors.PRIMARY_DARK,
      opacity: 0.35,
    },
    pivot: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.SECONDARY_ACCENT,
    },
  });
}
