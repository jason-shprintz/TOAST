import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import { AstronomyEvent, AstronomyEventType } from '../../stores/AstronomyEventStore';
import {
  useAstronomyEventStore,
  useCoreStore,
} from '../../stores/StoreContext';
import { FOOTER_HEIGHT } from '../../theme';

const EVENT_TYPE_DETAILS: Record<
  AstronomyEventType,
  { color: string; description: string }
> = {
  solar_eclipse: {
    color: '#FF6B35',
    description: 'Eclipse',
  },
  lunar_eclipse: {
    color: '#9B59B6',
    description: 'Eclipse',
  },
  solstice: {
    color: '#F39C12',
    description: 'Solstice',
  },
  equinox: {
    color: '#27AE60',
    description: 'Equinox',
  },
  supermoon: {
    color: '#3498DB',
    description: 'Supermoon',
  },
  planet_rise: {
    color: '#1ABC9C',
    description: 'Planet',
  },
};

const formatEventDate = (date: Date): string => {
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDaysUntil = (date: Date): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (24 * 3600 * 1000));
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays < 30) {
    return `In ${diffDays} days`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `In ~${months} month${months !== 1 ? 's' : ''}`;
  }
  return formatEventDate(date);
};

interface EventCardProps {
  event: AstronomyEvent;
  isExpanded: boolean;
  onToggle: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, isExpanded, onToggle }) => {
  const COLORS = useTheme();
  const typeInfo = EVENT_TYPE_DETAILS[event.type] ?? {
    color: COLORS.ACCENT,
    description: event.type,
  };
  const daysUntil = formatDaysUntil(event.date);
  const isImminent = event.date.getTime() - Date.now() < 7 * 24 * 3600 * 1000;

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${event.label}, ${daysUntil}. Tap to ${isExpanded ? 'collapse' : 'expand'} details.`}
    >
      <View
        style={[
          styles.eventCard,
          { borderColor: isImminent ? typeInfo.color : COLORS.SECONDARY_ACCENT },
        ]}
      >
        <LinearGradient
          colors={COLORS.TOAST_BROWN_GRADIENT}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardBackground}
        />
        <View style={styles.cardRow}>
          <Text style={styles.eventIcon}>{event.icon}</Text>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text
                style={[styles.eventLabel, { color: COLORS.PRIMARY_DARK }]}
                numberOfLines={1}
              >
                {event.label}
              </Text>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: typeInfo.color + '33' },
                ]}
              >
                <Text
                  style={[styles.typeBadgeText, { color: typeInfo.color }]}
                >
                  {typeInfo.description}
                </Text>
              </View>
            </View>
            <Text
              style={[styles.eventDate, { color: COLORS.PRIMARY_DARK }]}
            >
              {formatEventDate(event.date)}
            </Text>
            <Text
              style={[
                styles.daysUntil,
                {
                  color: isImminent ? typeInfo.color : COLORS.PRIMARY_DARK,
                  fontWeight: isImminent ? '700' : '500',
                },
              ]}
            >
              {daysUntil}
            </Text>
          </View>
          <Text style={[styles.expandArrow, { color: COLORS.PRIMARY_DARK }]}>
            {isExpanded ? '▲' : '▼'}
          </Text>
        </View>
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text
              style={[styles.eventDetail, { color: COLORS.PRIMARY_DARK }]}
            >
              {event.detail}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * SkyEventsScreen displays upcoming astronomical events in chronological
 * order for the next 12 months, including eclipses, solstices, equinoxes,
 * supermoons, and planet rise times.
 *
 * All calculations run fully offline using the `astronomia` library.
 *
 * @returns A React element containing the Sky Events screen UI.
 */
function SkyEventsScreen() {
  const COLORS = useTheme();
  const core = useCoreStore();
  const astronomyStore = useAstronomyEventStore();

  const [expandedEventId, setExpandedEventId] = React.useState<string | null>(
    null,
  );

  // Trigger event computation when location becomes available
  useEffect(() => {
    if (core.lastFix) {
      const { latitude, longitude } = core.lastFix.coords;
      astronomyStore.computeEvents(latitude, longitude);
    } else {
      // Compute without location (planet rise times will be skipped)
      astronomyStore.computeEvents(0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [core.lastFix]);

  const upcomingEvents = astronomyStore.getUpcomingEvents(12);
  const hasLocation = !!core.lastFix;

  const handleToggleExpand = (id: string) => {
    setExpandedEventId((prev) => (prev === id ? null : id));
  };

  return (
    <ScreenBody>
      <SectionHeader>Sky Events</SectionHeader>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {!hasLocation && (
            <View
              style={[
                styles.locationBanner,
                { borderColor: COLORS.SECONDARY_ACCENT },
              ]}
            >
              <LinearGradient
                colors={COLORS.TOAST_BROWN_GRADIENT}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardBackground}
              />
              <Text
                style={[styles.locationBannerText, { color: COLORS.PRIMARY_DARK }]}
              >
                📍 Enable location for planet rise times
              </Text>
            </View>
          )}

          {upcomingEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text
                style={[styles.emptyStateText, { color: COLORS.PRIMARY_DARK }]}
              >
                No upcoming sky events found in the next 12 months.
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={[styles.subheader, { color: COLORS.PRIMARY_DARK }]}
              >
                {upcomingEvents.length} event
                {upcomingEvents.length !== 1 ? 's' : ''} in the next 12 months
              </Text>
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isExpanded={expandedEventId === event.id}
                  onToggle={() => handleToggleExpand(event.id)}
                />
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </ScreenBody>
  );
}

export default observer(SkyEventsScreen);

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
  subheader: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
    marginBottom: 12,
    width: '90%',
  },
  locationBanner: {
    width: '90%',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  locationBannerText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  eventCard: {
    width: '90%',
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
    marginTop: 10,
    overflow: 'hidden',
  },
  cardBackground: {
    ...StyleSheet.absoluteFill,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIcon: {
    fontSize: 32,
    marginRight: 12,
    lineHeight: 38,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  eventLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  typeBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eventDate: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.85,
  },
  daysUntil: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  expandArrow: {
    fontSize: 12,
    marginLeft: 8,
    marginTop: 4,
    opacity: 0.6,
  },
  expandedContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.15)',
  },
  eventDetail: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});
