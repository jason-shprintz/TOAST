import { makeAutoObservable } from 'mobx';
import { CoreStore } from './CoreStore';
import { NavigationStore } from './NavigationStore';
import { ReferenceStore } from './ReferenceStore';
import { SettingsStore } from './SettingsStore';
import { SignalsStore } from './SignalsStore';

export class RootStore {
  coreStore: CoreStore;
  navigationStore: NavigationStore;
  referenceStore: ReferenceStore;
  settingsStore: SettingsStore;
  signalsStore: SignalsStore;

  constructor() {
    makeAutoObservable(this);
    this.coreStore = new CoreStore();
    this.navigationStore = new NavigationStore();
    this.referenceStore = new ReferenceStore();
    this.settingsStore = new SettingsStore();
    this.signalsStore = new SignalsStore();
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
    }
  }

  // Global app state
  isOfflineMode: boolean = true;

  toggleOfflineMode() {
    this.isOfflineMode = !this.isOfflineMode;
  }

  // Reset all stores
  reset() {
    this.coreStore.dispose();
    this.coreStore = new CoreStore();
    this.navigationStore = new NavigationStore();
    this.referenceStore = new ReferenceStore();
    this.settingsStore = new SettingsStore();
    this.signalsStore = new SignalsStore();
    this.isOfflineMode = true;
    // initializeSettings is intentionally not awaited - settings have sensible
    // defaults and components will re-render when settings finish loading from DB
    this.initializeSettings();
  }
}
