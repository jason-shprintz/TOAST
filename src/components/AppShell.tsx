import React, { PropsWithChildren } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme';
import LogoHeader from './LogoHeader';
import ScreenContainer from './ScreenContainer';

type Props = PropsWithChildren<{}>;

export default function AppShell({ children }: Props) {
  return (
    <ScreenContainer style={styles.shell}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            // Intentionally a no-op for now; this is just a persistent button.
          }}
          accessibilityLabel="Settings"
          accessibilityRole="button"
        >
          <Ionicons
            name="settings-outline"
            size={26}
            color={COLORS.PRIMARY_DARK}
          />
        </TouchableOpacity>

        <LogoHeader />
      </View>

      <View style={styles.content}>{children}</View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingTop: 0,
    paddingHorizontal: 0,
    alignItems: 'stretch',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 30,
    zIndex: 10,
    padding: 6,
  },
  content: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'stretch',
  },
});
