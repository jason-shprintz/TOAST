import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { JSX } from 'react';
import AppShell from '../components/AppShell';
import CommunicationsModule from '../modules/Communications/CommunicationsModule';
import CoreModule from '../modules/Core/CoreModule';
import NavigationModule from '../modules/Navigation/NavigationModule';
import PrepperModule from '../modules/Prepper/PrepperModule';
import ReferenceModule from '../modules/Reference/ReferenceModule';
import ChecklistEntryScreen from '../screens/Checklist/ChecklistEntryScreen';
import ChecklistScreen from '../screens/Checklist/ChecklistScreen';
import ComingSoonScreen from '../screens/Common/ComingSoonScreen';
import SearchScreen from '../screens/Common/SearchScreen';
import DecibelMeterScreen from '../screens/DecibelMeter/DecibelMeterScreen';
import DeviceStatusScreen from '../screens/DeviceStatus/DeviceStatusScreen';
import DigitalWhistleScreen from '../screens/DigitalWhistle/DigitalWhistleScreen';
import FlashlightScreen from '../screens/Flashlight/FlashlightScreen';
import NightvisionScreen from '../screens/Flashlight/NightvisionScreen';
import HomeScreen from '../screens/HomeScreen/HomeScreen';
import EditInventoryItemScreen from '../screens/Inventory/EditInventoryItemScreen';
import InventoryAllItemsScreen from '../screens/Inventory/InventoryAllItemsScreen';
import InventoryCategoryScreen from '../screens/Inventory/InventoryCategoryScreen';
import InventoryScreen from '../screens/Inventory/InventoryScreen';
import ManageInventoryCategoriesScreen from '../screens/Inventory/ManageInventoryCategoriesScreen';
import NewInventoryItemScreen from '../screens/Inventory/NewInventoryItemScreen';
import LunarCyclesScreen from '../screens/LunarCycles/LunarCyclesScreen';
import AlphaToMorseScreen from '../screens/MorseCode/AlphaToMorseScreen';
import MorseCodeCheatSheet from '../screens/MorseCode/MorseCodeCheatSheet';
import MorseCodeScreen from '../screens/MorseCode/MorseCodeScreen';
import MorseToAlphaScreen from '../screens/MorseCode/MorseToAlphaScreen';
import MorseTrainerLevelScreen from '../screens/MorseCode/MorseTrainerLevelScreen';
import MorseTrainerScreen from '../screens/MorseCode/MorseTrainerScreen';
import NatoPhoneticScreen from '../screens/MorseCode/NatoPhoneticScreen';
import BookmarkedNotesScreen from '../screens/Notepad/BookmarkedNotesScreen';
import EditNoteScreen from '../screens/Notepad/EditNoteScreen';
import ManageCategoriesScreen from '../screens/Notepad/ManageCategoriesScreen';
import NewNoteScreen from '../screens/Notepad/NewNoteScreen';
import NotepadScreen from '../screens/Notepad/NotepadScreen';
import RecentNotesScreen from '../screens/Notepad/RecentNotesScreen';
import NoteCategoryScreen from '../screens/Notepad/Shared/NoteCategoryScreen';
import NoteEntryScreen from '../screens/Notepad/Shared/NoteEntryScreen';
import EditPantryItemScreen from '../screens/Pantry/EditPantryItemScreen';
import ManagePantryCategoriesScreen from '../screens/Pantry/ManagePantryCategoriesScreen';
import NewPantryItemScreen from '../screens/Pantry/NewPantryItemScreen';
import PantryAllItemsScreen from '../screens/Pantry/PantryAllItemsScreen';
import PantryCategoryScreen from '../screens/Pantry/PantryCategoryScreen';
import PantryScreen from '../screens/Pantry/PantryScreen';
import RadioFrequenciesScreen from '../screens/RadioFrequencies/RadioFrequenciesScreen';
import RadioFrequencyDetailScreen from '../screens/RadioFrequencies/RadioFrequencyDetailScreen';
import BookmarkScreen from '../screens/Reference/BookmarkScreen';
import EmergencyScreen from '../screens/Reference/EmergencyScreen';
import HealthScreen from '../screens/Reference/HealthScreen';
import CategoryScreen from '../screens/Reference/Shared/CategoryScreen';
import EntryScreen from '../screens/Reference/Shared/EntryScreen';
import SurvivalScreen from '../screens/Reference/SurvivalScreen';
import ToolsAndKnotsScreen from '../screens/Reference/ToolsAndKnotsScreen';
import WeatherScreen from '../screens/Reference/WeatherScreen';
import ScenarioCardsScreen from '../screens/ScenarioCards/ScenarioCardsScreen';
import ScenarioCategoryScreen from '../screens/ScenarioCards/ScenarioCategoryScreen';
import ScenarioDetailScreen from '../screens/ScenarioCards/ScenarioDetailScreen';
import SunTimeScreen from '../screens/SunTime/SunTimeScreen';
import ConversionCategoryScreen from '../screens/UnitConversion/ConversionCategoryScreen';
import UnitConversionScreen from '../screens/UnitConversion/UnitConversionScreen';
import VoiceLogScreen from '../screens/VoiceLog/VoiceLogScreen';
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
function NavigatorContent(): JSX.Element {
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
          <Stack.Screen name="PrepperModule" component={PrepperModule} />
          {/* Shared */}
          <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          {/* Communications Module */}
          <Stack.Screen name="MorseCode" component={MorseCodeScreen} />
          <Stack.Screen name="AlphaToMorse" component={AlphaToMorseScreen} />
          <Stack.Screen name="MorseToAlpha" component={MorseToAlphaScreen} />
          <Stack.Screen
            name="MorseCodeCheatSheet"
            component={MorseCodeCheatSheet}
          />
          <Stack.Screen name="MorseTrainer" component={MorseTrainerScreen} />
          <Stack.Screen
            name="MorseTrainerLevel"
            component={MorseTrainerLevelScreen}
          />
          <Stack.Screen name="NatoPhonetic" component={NatoPhoneticScreen} />
          <Stack.Screen
            name="RadioFrequencies"
            component={RadioFrequenciesScreen}
          />
          <Stack.Screen
            name="RadioFrequencyDetail"
            component={RadioFrequencyDetailScreen}
          />
          <Stack.Screen name="DecibelMeter" component={DecibelMeterScreen} />
          <Stack.Screen
            name="DigitalWhistle"
            component={DigitalWhistleScreen}
          />
          {/* Core Module */}
          <Stack.Screen name="DeviceStatus" component={DeviceStatusScreen} />
          <Stack.Screen name="Flashlight" component={FlashlightScreen} />
          <Stack.Screen
            name="Nightvision"
            component={NightvisionScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="VoiceLog" component={VoiceLogScreen} />
          <Stack.Screen name="NewNote" component={NewNoteScreen} />
          <Stack.Screen name="EditNote" component={EditNoteScreen} />
          <Stack.Screen name="Notepad" component={NotepadScreen} />
          <Stack.Screen name="NoteCategory" component={NoteCategoryScreen} />
          <Stack.Screen name="NoteEntry" component={NoteEntryScreen} />
          <Stack.Screen name="RecentNotes" component={RecentNotesScreen} />
          <Stack.Screen
            name="BookmarkedNotes"
            component={BookmarkedNotesScreen}
          />
          <Stack.Screen
            name="ManageCategories"
            component={ManageCategoriesScreen}
          />
          <Stack.Screen name="Checklist" component={ChecklistScreen} />
          <Stack.Screen
            name="ChecklistEntry"
            component={ChecklistEntryScreen}
          />
          <Stack.Screen name="SunTime" component={SunTimeScreen} />
          <Stack.Screen name="LunarCycles" component={LunarCyclesScreen} />
          {/* Unit Conversion */}
          <Stack.Screen
            name="UnitConversion"
            component={UnitConversionScreen}
          />
          <Stack.Screen
            name="ConversionCategory"
            component={ConversionCategoryScreen}
            options={{
              presentation: 'modal',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
          {/* Inventory */}
          <Stack.Screen name="Inventory" component={InventoryScreen} />
          <Stack.Screen
            name="InventoryCategory"
            component={InventoryCategoryScreen}
          />
          <Stack.Screen
            name="InventoryAllItems"
            component={InventoryAllItemsScreen}
          />
          <Stack.Screen
            name="ManageInventoryCategories"
            component={ManageInventoryCategoriesScreen}
          />
          <Stack.Screen
            name="NewInventoryItem"
            component={NewInventoryItemScreen}
          />
          <Stack.Screen
            name="EditInventoryItem"
            component={EditInventoryItemScreen}
          />
          {/* Pantry */}
          <Stack.Screen name="Pantry" component={PantryScreen} />
          <Stack.Screen
            name="PantryCategory"
            component={PantryCategoryScreen}
          />
          <Stack.Screen
            name="PantryAllItems"
            component={PantryAllItemsScreen}
          />
          <Stack.Screen
            name="ManagePantryCategories"
            component={ManagePantryCategoriesScreen}
          />
          <Stack.Screen name="NewPantryItem" component={NewPantryItemScreen} />
          <Stack.Screen
            name="EditPantryItem"
            component={EditPantryItemScreen}
          />
          {/* Reference Module */}
          <Stack.Screen name="Bookmark" component={BookmarkScreen} />
          <Stack.Screen name="Category" component={CategoryScreen} />
          <Stack.Screen name="Entry" component={EntryScreen} />
          <Stack.Screen name="Health" component={HealthScreen} />
          <Stack.Screen name="Survival" component={SurvivalScreen} />
          <Stack.Screen name="Weather" component={WeatherScreen} />
          <Stack.Screen name="ToolsAndKnots" component={ToolsAndKnotsScreen} />
          <Stack.Screen name="Emergency" component={EmergencyScreen} />
          {/* Scenario Cards */}
          <Stack.Screen
            name="ScenarioCards"
            component={ScenarioCardsScreen}
          />
          <Stack.Screen
            name="ScenarioCategory"
            component={ScenarioCategoryScreen}
          />
          <Stack.Screen
            name="ScenarioDetail"
            component={ScenarioDetailScreen}
          />
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
export default function AppNavigator(): JSX.Element {
  return (
    <NavigationHistoryProvider>
      <NavigatorContent />
    </NavigationHistoryProvider>
  );
}
