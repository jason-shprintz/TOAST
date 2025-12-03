import React from 'react';
import { observer } from 'mobx-react-lite';
import PlaceholderCard from '../../components/PlaceholderCard';
import SectionHeader from '../../components/SectionHeader';
import LogoHeader from '../../components/LogoHeader';
import Grid from '../../components/Grid';
import { useCoreStore } from '../../stores';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../../components/ScreenContainer';

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
