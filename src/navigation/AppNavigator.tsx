import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen/HomeScreen';
import CoreModule from '../modules/Core/CoreModule';
import NavigationModule from '../modules/Navigation/NavigationModule';
import ReferenceModule from '../modules/Reference/ReferenceModule';
import CommunicationsModule from '../modules/Communications/CommunicationsModule';
import ComingSoonScreen from '../screens/Common/ComingSoonScreen';
import FlashlightScreen from '../screens/Flashlight/FlashlightScreen';
import DeviceStatusScreen from '../screens/DeviceStatus/DeviceStatusScreen';
import NotepadScreen from '../screens/Notepad/NotepadScreen';
import NewNoteScreen from '../screens/Notepad/NewNoteScreen';
import RecentNotesScreen from '../screens/Notepad/RecentNotesScreen';
import SavedNotesScreen from '../screens/Notepad/SavedNotesScreen';

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
        {/* Modules */}
        <Stack.Screen name="CoreModule" component={CoreModule} />
        <Stack.Screen name="NavigationModule" component={NavigationModule} />
        <Stack.Screen name="ReferenceModule" component={ReferenceModule} />
        <Stack.Screen
          name="CommunicationsModule"
          component={CommunicationsModule}
        />
        {/* Shared */}
        <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
        {/* Core Module */}
        <Stack.Screen name="Flashlight" component={FlashlightScreen} />
        <Stack.Screen name="DeviceStatus" component={DeviceStatusScreen} />
        <Stack.Screen name="Notepad" component={NotepadScreen} />
        <Stack.Screen name="NewNote" component={NewNoteScreen} />
        <Stack.Screen name="RecentNotes" component={RecentNotesScreen} />
        <Stack.Screen name="SavedNotes" component={SavedNotesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
