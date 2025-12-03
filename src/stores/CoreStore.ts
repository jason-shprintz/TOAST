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
  private sosTimer: ReturnType<typeof setTimeout> | null = null;
  private isTorchOn: boolean = false;
  private strobeInterval: ReturnType<typeof setInterval> | null = null;
  strobeFrequencyHz: number = 5; // default frequency

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
    // Stop any running patterns
    this.stopSOS();
    this.stopStrobe();
    // Apply steady on/off
    if (this.flashlightMode === 'on') {
      this.setTorch(true);
      return;
    }
    if (this.flashlightMode === 'sos') {
      this.startSOS();
      return;
    }
    if (this.flashlightMode === 'strobe') {
      this.startStrobe();
      return;
    }
    // Default: off
    this.setTorch(false);
  }

  private handleAppStateChange = (state: string) => {
    // If returning to foreground while flashlight should be on, re-apply.
    if (state === 'active') {
      this.applyFlashlightState();
    }
  };

  // Low-level torch setter with state tracking
  private setTorch(on: boolean) {
    this.isTorchOn = on;
    Torch.switchState(on);
  }

  // SOS pattern: "... --- ..." in Morse
  // Timing conventions: dot=1 unit, dash=3 units, intra-signal gap=1 unit off,
  // letter gap=3 units off, repetition gap=1000ms off (as requested).
  // Choose unit=200ms for readable pacing.
  private readonly sosUnitMs = 200;

  private startSOS() {
    this.stopSOS(); // Stop any existing SOS pattern
    // Sequence builder: returns array of {on:boolean, ms:number}
    const unit = this.sosUnitMs;
    const dot = [
      { on: true, ms: unit },
      { on: false, ms: unit },
    ];
    const dash = [
      { on: true, ms: 3 * unit },
      { on: false, ms: unit },
    ];
    const letterGap = [{ on: false, ms: 3 * unit }];

    const S = [...dot, ...dot, ...dot, ...letterGap];
    const O = [...dash, ...dash, ...dash, ...letterGap];
    const sequence = [...S, ...O, ...S];

    const repeatPause = [{ on: false, ms: 1000 }];

    const runOnce = (index: number) => {
      if (this.flashlightMode !== 'sos') {
        this.setTorch(false);
        return;
      }
      const step = sequence[index] ?? null;
      const nextDelay = step ? step.ms : repeatPause[0].ms;
      const nextOn = step ? step.on : false;
      this.setTorch(nextOn);
      const nextIndex = step
        ? index + 1 < sequence.length
          ? index + 1
          : -1
        : -1;
      this.sosTimer = setTimeout(() => {
        if (nextIndex === -1) {
          // Pause then restart sequence
          this.setTorch(false);
          this.sosTimer = setTimeout(() => runOnce(0), repeatPause[0].ms);
        } else {
          runOnce(nextIndex);
        }
      }, nextDelay);
    };

    // Kick off the sequence
    runOnce(0);
  }

  private stopSOS() {
    if (this.sosTimer) {
      clearTimeout(this.sosTimer);
      this.sosTimer = null;
    }
  }

  // Strobe implementation: toggle torch at `strobeFrequencyHz`
  setStrobeFrequency(hz: number) {
    const clamped = Math.max(1, Math.min(30, Math.round(hz)));
    this.strobeFrequencyHz = clamped;
    if (this.flashlightMode === 'strobe') {
      // restart strobe at new frequency
      this.startStrobe();
    }
  }

  private startStrobe() {
    this.stopStrobe();
    const hz = this.strobeFrequencyHz;
    const periodMs = Math.max(10, Math.floor(1000 / hz));
    let on = false;
    this.strobeInterval = setInterval(() => {
      if (this.flashlightMode !== 'strobe') {
        this.stopStrobe();
        return;
      }
      on = !on;
      this.setTorch(on);
    }, periodMs);
  }

  private stopStrobe() {
    if (this.strobeInterval) {
      clearInterval(this.strobeInterval);
      this.strobeInterval = null;
    }
    // Ensure torch off when stopping strobe unless steady on is selected
    if (this.flashlightMode !== 'on') {
      this.setTorch(false);
    }
  }

  dispose() {
    this.appStateSubscription?.remove();
  }
}
