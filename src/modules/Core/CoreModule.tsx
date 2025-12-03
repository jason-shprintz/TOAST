import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { observer } from 'mobx-react-lite';
import PlaceholderCard from '../../components/PlaceholderCard';
import { COLORS } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import SectionHeader from '../../components/SectionHeader';
import { useCoreStore } from '../../stores';

export default observer(function CoreModule() {
  const navigation = useNavigation<any>();
  const coreStore = useCoreStore();

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/toast-logo.png')}
        style={styles.logo}
      />
      <SectionHeader>Core</SectionHeader>

      <View style={styles.grid}>
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
      </View>
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
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 10,
    backgroundColor: COLORS.SECONDARY_ACCENT,
    borderRadius: 90,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.TOAST_BROWN,
  },
});
