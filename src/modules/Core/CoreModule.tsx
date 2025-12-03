import React from 'react';
import { View, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import PlaceholderCard from '../../components/PlaceholderCard';
import { COLORS } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import SectionHeader from '../../components/SectionHeader';
import LogoHeader from '../../components/LogoHeader';
import Grid from '../../components/Grid';
import { useCoreStore } from '../../stores';

export default observer(function CoreModule() {
  const navigation = useNavigation<any>();
  const coreStore = useCoreStore();

  return (
    <View style={styles.container}>
      <LogoHeader />
      <SectionHeader>Core</SectionHeader>

      <Grid style={styles.gridSpacing}>
        {coreStore.tools.map(tool => (
          <PlaceholderCard
            key={tool.id}
            title={tool.name}
            icon={tool.icon}
            onPress={() => {
              if (tool.id === 'flashlight') {
                navigation.navigate('Flashlight');
              } else {
                navigation.navigate('ComingSoon', {
                  title: tool.name,
                  icon: tool.icon,
                });
              }
            }}
          />
        ))}
      </Grid>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    backgroundColor: COLORS.TOAST_BROWN,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 12,
    fontWeight: '600',
  },
  // grid replaced by shared Grid component
  gridSpacing: {
    paddingTop: 20,
  },
});
