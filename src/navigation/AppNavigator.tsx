import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen/HomeScreen';
import CoreModule from '../modules/Core/CoreModule';
import NavigationModule from '../modules/Navigation/NavigationModule';
import ReferenceModule from '../modules/Reference/ReferenceModule';
import SignalsModule from '../modules/Signals/SignalsModule';
import ComingSoonScreen from '../screens/Common/ComingSoonScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CoreModule" component={CoreModule} />
        <Stack.Screen name="NavigationModule" component={NavigationModule} />
        <Stack.Screen name="ReferenceModule" component={ReferenceModule} />
        <Stack.Screen name="SignalsModule" component={SignalsModule} />
        <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
