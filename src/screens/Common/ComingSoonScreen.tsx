import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../theme';

type ComingSoonParams = {
  title?: string;
  icon?: string;
  message?: string;
};

type Props = {
  route: { params?: ComingSoonParams };
};

export default function ComingSoonScreen({ route }: Props) {
  const title = route?.params?.title ?? 'Coming Soon';
  const icon = route?.params?.icon ?? 'construct-outline';
  const message =
    route?.params?.message ?? 'This feature is under construction.';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons
          name={icon}
          size={72}
          color={COLORS.PRIMARY_DARK}
          style={styles.icon}
        />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: COLORS.SECONDARY_ACCENT,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
    textAlign: 'center',
  },
});
