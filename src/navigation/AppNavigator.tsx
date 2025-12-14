import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import CommunicationsModule from '../modules/Communications/CommunicationsModule';
import CoreModule from '../modules/Core/CoreModule';
import NavigationModule from '../modules/Navigation/NavigationModule';
import ReferenceModule from '../modules/Reference/ReferenceModule';
import ComingSoonScreen from '../screens/Common/ComingSoonScreen';
import DeviceStatusScreen from '../screens/DeviceStatus/DeviceStatusScreen';
import FlashlightScreen from '../screens/Flashlight/FlashlightScreen';
import HomeScreen from '../screens/HomeScreen/HomeScreen';
import NewNoteScreen from '../screens/Notepad/NewNoteScreen';
import NotepadScreen from '../screens/Notepad/NotepadScreen';
import RecentNotesScreen from '../screens/Notepad/RecentNotesScreen';
import SavedNotesScreen from '../screens/Notepad/SavedNotesScreen';
import BookmarkScreen from '../screens/Reference/BookmarkScreen';
import EntryScreen from '../screens/Reference/EntryScreen';
import HealthCategoryScreen from '../screens/Reference/HealthCategoryScreen';
import HealthScreen from '../screens/Reference/HealthScreen';
import SurvivalCategoryScreen from '../screens/Reference/SurvivalCategoryScreen';
import SurvivalScreen from '../screens/Reference/SurvivalScreen';

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
        {/* Reference Module */}
        <Stack.Screen name="Health" component={HealthScreen} />
        <Stack.Screen name="HealthCategory" component={HealthCategoryScreen} />
        <Stack.Screen name="HealthEntry" component={EntryScreen} />
        <Stack.Screen name="Survival" component={SurvivalScreen} />
        <Stack.Screen
          name="SurvivalCategory"
          component={SurvivalCategoryScreen}
        />
        <Stack.Screen name="SurvivalEntry" component={EntryScreen} />
        <Stack.Screen name="Bookmark" component={BookmarkScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
