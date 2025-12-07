import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Grid from '../../components/Grid';
import LogoHeader from '../../components/LogoHeader';
import PlaceholderCard from '../../components/PlaceholderCard';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import { useCoreStore } from '../../stores';

export default observer(function CoreModule() {
  const navigation = useNavigation<any>();
  const coreStore = useCoreStore();

  return (
    <ScreenContainer>
      <LogoHeader />
      <SectionHeader>Core</SectionHeader>
      <Grid>
        {coreStore.tools.map(tool => (
          <PlaceholderCard
            key={tool.id}
            title={tool.name}
            icon={tool.icon}
            onPress={() => {
              if (tool.id === 'flashlight') {
                navigation.navigate('Flashlight');
              } else if (tool.id === 'device-status') {
                navigation.navigate('DeviceStatus');
              } else if (tool.id === 'notepad') {
                navigation.navigate('Notepad');
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
    </ScreenContainer>
  );
});
