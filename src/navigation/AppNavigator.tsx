import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import AppShell from '../components/AppShell';
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
import NoteCategoryScreen from '../screens/Notepad/Shared/NoteCategoryScreen';
import NoteEntryScreen from '../screens/Notepad/Shared/NoteEntryScreen';
import BookmarkScreen from '../screens/Reference/BookmarkScreen';
import EmergencyScreen from '../screens/Reference/EmergencyScreen';
import HealthScreen from '../screens/Reference/HealthScreen';
import CategoryScreen from '../screens/Reference/Shared/CategoryScreen';
import EntryScreen from '../screens/Reference/Shared/EntryScreen';
import SurvivalScreen from '../screens/Reference/SurvivalScreen';
import ToolsAndKnotsScreen from '../screens/Reference/ToolsAndKnotsScreen';
import WeatherScreen from '../screens/Reference/WeatherScreen';
import {
  NavigationHistoryProvider,
  useNavigationHistory,
} from './NavigationHistoryContext';
import { navigationRef } from './navigationRef';

const Stack = createNativeStackNavigator();

/**
 * NavigatorContent is the internal component that uses the NavigationHistory context.
 *
 * This component is separated from AppNavigator to allow it to access the NavigationHistory
 * context that is provided by NavigationHistoryProvider.
 *
 * @returns {JSX.Element} The navigation container with the configured stack navigator.
 */
function NavigatorContent() {
  const navigationHistory = useNavigationHistory();

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={() => navigationHistory.onNavigationStateChange()}
    >
      <AppShell>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: 'transparent',
            },
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
          <Stack.Screen name="DeviceStatus" component={DeviceStatusScreen} />
          <Stack.Screen name="Flashlight" component={FlashlightScreen} />
          <Stack.Screen name="NewNote" component={NewNoteScreen} />
          <Stack.Screen name="Notepad" component={NotepadScreen} />
          <Stack.Screen name="NoteCategory" component={NoteCategoryScreen} />
          <Stack.Screen name="NoteEntry" component={NoteEntryScreen} />
          <Stack.Screen name="RecentNotes" component={RecentNotesScreen} />
          <Stack.Screen name="SavedNotes" component={SavedNotesScreen} />
          {/* Reference Module */}
          <Stack.Screen name="Bookmark" component={BookmarkScreen} />
          <Stack.Screen name="Category" component={CategoryScreen} />
          <Stack.Screen name="Entry" component={EntryScreen} />
          <Stack.Screen name="Health" component={HealthScreen} />
          <Stack.Screen name="Survival" component={SurvivalScreen} />
          <Stack.Screen name="Weather" component={WeatherScreen} />
          <Stack.Screen name="ToolsAndKnots" component={ToolsAndKnotsScreen} />
          <Stack.Screen name="Emergency" component={EmergencyScreen} />
        </Stack.Navigator>
      </AppShell>
    </NavigationContainer>
  );
}

/**
 * AppNavigator is the root navigation component for the application.
 *
 * It sets up the main navigation stack using React Navigation, defining all the primary screens and modules
 * available in the app. The navigator is wrapped in a `NavigationContainer` and uses a stack-based navigation pattern.
 *
 * @returns {JSX.Element} The navigation container with the configured stack navigator.
 *
 * @remarks
 * - The initial route is set to "Home".
 * - The header is hidden for all screens by default.
 * - Screens are grouped by modules (Core, Navigation, Reference, Communications) and shared screens.
 * - NavigationHistory is provided via context for proper state management.
 *
 * @example
 * ```tsx
 * <AppNavigator />
 * ```
 */
export default function AppNavigator() {
  return (
    <NavigationHistoryProvider>
      <NavigatorContent />
    </NavigationHistoryProvider>
  );
}
