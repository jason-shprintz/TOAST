import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as SunCalc from 'suncalc';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { COLORS, FOOTER_HEIGHT } from '../../theme';

interface MoonPhase {
  date: Date;
  phaseName: string;
  fraction: number;
  phaseValue: number;
}

// Constants
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * LunarCyclesScreen
 *
 * Displays lunar cycle information for the next 30 days including:
 * - Current moon phase
 * - Next full moon
 * - Next first quarter (half moon)
 * - Next last quarter (half moon)
 * - Next new moon
 * - Daily moon phases over the next 30 days
 *
 * Uses the suncalc library for lunar phase calculations.
 *
 * @returns A React element containing the Lunar Cycles screen UI.
 */

function LunarCyclesScreen() {
  const [currentPhase, setCurrentPhase] = useState<MoonPhase | null>(null);
  const [nextFullMoon, setNextFullMoon] = useState<MoonPhase | null>(null);
  const [nextFirstQuarter, setNextFirstQuarter] = useState<MoonPhase | null>(
    null,
  );
  const [nextLastQuarter, setNextLastQuarter] = useState<MoonPhase | null>(
    null,
  );
  const [nextNewMoon, setNextNewMoon] = useState<MoonPhase | null>(null);
  const [dailyPhases, setDailyPhases] = useState<MoonPhase[]>([]);

  useEffect(() => {
    const now = new Date();
    const calculateMoonPhases = () => {
      const phases: MoonPhase[] = [];
      let foundFullMoon = false;
      let foundFirstQuarter = false;
      let foundLastQuarter = false;
      let foundNewMoon = false;

      // Calculate current phase
      const currentIllum = SunCalc.getMoonIllumination(now);
      const currentPhaseName = getMoonPhaseName(currentIllum.phase);
      setCurrentPhase({
        date: now,
        phaseName: currentPhaseName,
        fraction: currentIllum.fraction,
        phaseValue: currentIllum.phase,
      });

      // Calculate phases for the next 30 days
      for (let i = 0; i <= 30; i++) {
        const date = new Date(now.getTime() + i * MILLISECONDS_PER_DAY);
        const illum = SunCalc.getMoonIllumination(date);
        const phaseName = getMoonPhaseName(illum.phase);

        const moonPhase: MoonPhase = {
          date,
          phaseName,
          fraction: illum.fraction,
          phaseValue: illum.phase,
        };

        phases.push(moonPhase);

        // Find next key moon phases
        if (!foundFullMoon && isFullMoon(illum.phase)) {
          setNextFullMoon(moonPhase);
          foundFullMoon = true;
        }
        if (!foundFirstQuarter && isFirstQuarter(illum.phase)) {
          setNextFirstQuarter(moonPhase);
          foundFirstQuarter = true;
        }
        if (!foundLastQuarter && isLastQuarter(illum.phase)) {
          setNextLastQuarter(moonPhase);
          foundLastQuarter = true;
        }
        if (!foundNewMoon && i > 0 && isNewMoon(illum.phase)) {
          setNextNewMoon(moonPhase);
          foundNewMoon = true;
        }
      }

      setDailyPhases(phases);
    };

    calculateMoonPhases();
  }, []);

  const getMoonPhaseName = (phase: number): string => {
    if (phase < 0.03 || phase > 0.97) return 'New Moon';
    if (phase < 0.22) return 'Waxing Crescent';
    if (phase < 0.28) return 'First Quarter';
    if (phase < 0.47) return 'Waxing Gibbous';
    if (phase < 0.53) return 'Full Moon';
    if (phase < 0.72) return 'Waning Gibbous';
    if (phase < 0.78) return 'Last Quarter';
    return 'Waning Crescent';
  };

  const isFullMoon = (phase: number): boolean => {
    return phase >= 0.47 && phase <= 0.53;
  };

  const isFirstQuarter = (phase: number): boolean => {
    return phase >= 0.22 && phase <= 0.28;
  };

  const isLastQuarter = (phase: number): boolean => {
    return phase >= 0.72 && phase <= 0.78;
  };

  const isNewMoon = (phase: number): boolean => {
    return phase < 0.03 || phase > 0.97;
  };

  const getMoonEmoji = (phaseName: string): string => {
    switch (phaseName) {
      case 'New Moon':
        return '🌑';
      case 'Waxing Crescent':
        return '🌒';
      case 'First Quarter':
        return '🌓';
      case 'Waxing Gibbous':
        return '🌔';
      case 'Full Moon':
        return '🌕';
      case 'Waning Gibbous':
        return '🌖';
      case 'Last Quarter':
        return '🌗';
      case 'Waning Crescent':
        return '🌘';
      default:
        return '🌙';
    }
  };

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString(undefined, options);
  };

  const formatDateTime = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };
    return date.toLocaleString(undefined, options);
  };

  const renderKeyPhaseCard = (
    label: string,
    phase: MoonPhase | null,
    emoji: string,
  ) => (
    <View style={styles.keyCard} key={label}>
      <LinearGradient
        colors={COLORS.TOAST_BROWN_GRADIENT}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardBackground}
      />
      <View style={styles.keyCardContent}>
        <Text style={styles.keyCardEmoji}>{emoji}</Text>
        <View style={styles.keyCardText}>
          <Text style={styles.keyLabel}>{label}</Text>
          {phase && (
            <>
              <Text style={styles.keyDate}>{formatDate(phase.date)}</Text>
              <Text style={styles.keyIllumination}>
                {(phase.fraction * 100).toFixed(0)}% illuminated
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );

  const renderDailyPhaseCard = (phase: MoonPhase, index: number) => (
    <View style={styles.dailyCard} key={index}>
      <LinearGradient
        colors={COLORS.TOAST_BROWN_GRADIENT}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardBackground}
      />
      <View style={styles.dailyCardContent}>
        <Text style={styles.dailyEmoji}>{getMoonEmoji(phase.phaseName)}</Text>
        <View style={styles.dailyCardText}>
          <Text style={styles.dailyDate}>{formatDateTime(phase.date)}</Text>
          <Text style={styles.dailyPhase}>{phase.phaseName}</Text>
          <Text style={styles.dailyIllumination}>
            {(phase.fraction * 100).toFixed(0)}% illuminated
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenBody>
      <SectionHeader>Lunar Cycles</SectionHeader>

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Current Phase */}
          {currentPhase && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Moon Phase</Text>
              <View style={styles.currentCard}>
                <LinearGradient
                  colors={COLORS.TOAST_BROWN_GRADIENT}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardBackground}
                />
                <Text style={styles.currentEmoji}>
                  {getMoonEmoji(currentPhase.phaseName)}
                </Text>
                <Text style={styles.currentPhase}>
                  {currentPhase.phaseName}
                </Text>
                <Text style={styles.currentIllumination}>
                  {(currentPhase.fraction * 100).toFixed(0)}% illuminated
                </Text>
              </View>
            </View>
          )}

          {/* Key Phases */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Key Phases</Text>
            {nextNewMoon &&
              renderKeyPhaseCard('Next New Moon', nextNewMoon, '🌑')}
            {nextFirstQuarter &&
              renderKeyPhaseCard('Next First Quarter', nextFirstQuarter, '🌓')}
            {nextFullMoon &&
              renderKeyPhaseCard('Next Full Moon', nextFullMoon, '🌕')}
            {nextLastQuarter &&
              renderKeyPhaseCard('Next Last Quarter', nextLastQuarter, '🌗')}
          </View>

          {/* Daily Phases */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next 30 Days</Text>
            {dailyPhases.map((phase, index) =>
              renderDailyPhaseCard(phase, index),
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenBody>
  );
}

export default LunarCyclesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    paddingBottom: FOOTER_HEIGHT,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  section: {
    width: '90%',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.PRIMARY_DARK,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  currentCard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    padding: 24,
    overflow: 'hidden',
    alignItems: 'center',
  },
  currentEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  currentPhase: {
    fontSize: 24,
    color: COLORS.PRIMARY_DARK,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  currentIllumination: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.8,
  },
  keyCard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.SECONDARY_ACCENT,
    padding: 16,
    marginTop: 12,
    overflow: 'hidden',
  },
  keyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyCardEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  keyCardText: {
    flex: 1,
  },
  keyLabel: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  keyDate: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginBottom: 2,
  },
  keyIllumination: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
  },
  dailyCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY_ACCENT,
    padding: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  dailyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  dailyCardText: {
    flex: 1,
  },
  dailyDate: {
    fontSize: 13,
    color: COLORS.PRIMARY_DARK,
    fontWeight: '600',
    marginBottom: 2,
  },
  dailyPhase: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    marginBottom: 2,
  },
  dailyIllumination: {
    fontSize: 11,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
  },
  cardBackground: {
    ...StyleSheet.absoluteFill,
  },
});
