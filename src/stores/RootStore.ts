import { makeAutoObservable } from 'mobx';
import { BarometerStore } from './BarometerStore';
import { CoreStore } from './CoreStore';
import { InventoryStore } from './InventoryStore';
import { NavigationStore } from './NavigationStore';
import { PantryStore } from './PantryStore';
import { ReferenceStore } from './ReferenceStore';
import { SettingsStore } from './SettingsStore';
import { SignalsStore } from './SignalsStore';
import { SolarCycleNotificationStore } from './SolarCycleNotificationStore';

export class RootStore {
  coreStore: CoreStore;
  inventoryStore: InventoryStore;
  pantryStore: PantryStore;
  navigationStore: NavigationStore;
  referenceStore: ReferenceStore;
  settingsStore: SettingsStore;
  signalsStore: SignalsStore;
  solarCycleNotificationStore: SolarCycleNotificationStore;
  barometerStore: BarometerStore;

  constructor() {
    makeAutoObservable(this);
    this.coreStore = new CoreStore();
    this.inventoryStore = new InventoryStore();
    this.pantryStore = new PantryStore();
    this.navigationStore = new NavigationStore();
    this.referenceStore = new ReferenceStore();
    this.settingsStore = new SettingsStore();
    this.signalsStore = new SignalsStore();
    this.solarCycleNotificationStore = new SolarCycleNotificationStore();
    this.barometerStore = new BarometerStore();
    this.initializeSettings();
  }

  /**
   * Initialize settings by loading them from the database
   */
  private async initializeSettings() {
    // Wait for CoreStore to initialize the database, then load categories and settings
    await this.coreStore.initNotesDb();
    if (this.coreStore.notesDb) {
      // Load categories first to ensure dependent logic sees a consistent category list
      await this.coreStore.loadCategories();
      await this.settingsStore.loadSettings(this.coreStore.notesDb);
      // Initialize solar cycle notification store with same database
      await this.solarCycleNotificationStore.initDatabase(
        this.coreStore.notesDb,
      );
      await this.solarCycleNotificationStore.loadSettings();
    }
    // Initialize inventory and pantry databases
    await this.inventoryStore.initDatabase();
    await this.pantryStore.initDatabase();
  }

  // Global app state
  isOfflineMode: boolean = true;

  toggleOfflineMode() {
    this.isOfflineMode = !this.isOfflineMode;
  }

  // Reset all stores
  reset() {
    this.coreStore.dispose();
    this.inventoryStore.dispose();
    this.pantryStore.dispose();
    this.solarCycleNotificationStore.dispose();
    this.barometerStore.stop();
    this.coreStore = new CoreStore();
    this.inventoryStore = new InventoryStore();
    this.pantryStore = new PantryStore();
    this.navigationStore = new NavigationStore();
    this.referenceStore = new ReferenceStore();
    this.settingsStore = new SettingsStore();
    this.signalsStore = new SignalsStore();
    this.solarCycleNotificationStore = new SolarCycleNotificationStore();
    this.barometerStore = new BarometerStore();
    this.isOfflineMode = true;
    // initializeSettings is intentionally not awaited - settings have sensible
    // defaults and components will re-render when settings finish loading from DB
    this.initializeSettings();
  }
}
