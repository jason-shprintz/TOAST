import { makeAutoObservable } from 'mobx';
import Torch from 'react-native-torch';
import { AppState, NativeEventSubscription } from 'react-native';

export interface Tool {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export class CoreStore {
  tools: Tool[] = [
    {
      id: 'flashlight',
      name: 'Flashlight',
      icon: 'flashlight-outline',
      enabled: false,
    },
    {
      id: 'notepad',
      name: 'Notepad',
      icon: 'document-text-outline',
      enabled: false,
    },
  ];

  private appStateSubscription: NativeEventSubscription;

  constructor() {
    makeAutoObservable(this);
    // Keep torch consistent when app state changes (best-effort)
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );
  }

  toggleTool(toolId: string) {
    const tool = this.tools.find(t => t.id === toolId);
    if (tool) {
      tool.enabled = !tool.enabled;
    }
  }

  get enabledTools() {
    return this.tools.filter(tool => tool.enabled);
  }

  get totalTools() {
    return this.tools.length;
  }

  // Flashlight state management
  flashlightMode: 'off' | 'on' | 'sos' | 'strobe' = 'off';

  setFlashlightMode(mode: 'off' | 'on' | 'sos' | 'strobe') {
    // Exclusive selection: tapping active mode turns it off
    const next = this.flashlightMode === mode ? 'off' : mode;
    this.flashlightMode = next;
    this.applyFlashlightState();
  }

  get isFlashlightOn() {
    return this.flashlightMode === 'on';
  }

  private applyFlashlightState() {
    // For now, only implement steady on/off. SOS/Strobe pending.
    Torch.switchState(this.isFlashlightOn);
  }

  private handleAppStateChange = (state: string) => {
    // If returning to foreground while flashlight should be on, re-apply.
    if (state === 'active') {
      this.applyFlashlightState();
    }
  };

  dispose() {
    this.appStateSubscription?.remove();
  }
}
