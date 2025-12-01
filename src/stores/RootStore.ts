import { makeAutoObservable } from 'mobx';
import { CoreStore } from './CoreStore';
import { NavigationStore } from './NavigationStore';
import { ReferenceStore } from './ReferenceStore';
import { SignalsStore } from './SignalsStore';

export class RootStore {
  coreStore: CoreStore;
  navigationStore: NavigationStore;
  referenceStore: ReferenceStore;
  signalsStore: SignalsStore;

  constructor() {
    this.coreStore = new CoreStore();
    this.navigationStore = new NavigationStore();
    this.referenceStore = new ReferenceStore();
    this.signalsStore = new SignalsStore();

    makeAutoObservable(this);
  }

  // Global app state
  isOfflineMode: boolean = true;

  toggleOfflineMode() {
    this.isOfflineMode = !this.isOfflineMode;
  }

  // Reset all stores
  reset() {
    this.coreStore = new CoreStore();
    this.navigationStore = new NavigationStore();
    this.referenceStore = new ReferenceStore();
    this.signalsStore = new SignalsStore();
  }
}
