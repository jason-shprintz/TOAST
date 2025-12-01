import { makeAutoObservable } from 'mobx';

export interface Signal {
  id: string;
  type: 'ham' | 'bluetooth';
  name: string;
  frequency?: string;
  strength?: number;
  connected: boolean;
}

// Counter to ensure unique IDs even when multiple signals are added in the same millisecond
let idCounter = 0;

function generateUniqueId(): string {
  const timestamp = Date.now();
  const counter = idCounter++;
  return `${timestamp}-${counter}`;
}

export class SignalsStore {
  signals: Signal[] = [];

  isScanning: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  addSignal(signal: Omit<Signal, 'id'>) {
    this.signals.push({
      ...signal,
      id: generateUniqueId(),
    });
  }

  removeSignal(signalId: string) {
    this.signals = this.signals.filter(s => s.id !== signalId);
  }

  toggleConnection(signalId: string) {
    const signal = this.signals.find(s => s.id === signalId);
    if (signal) {
      signal.connected = !signal.connected;
    }
  }

  startScanning() {
    this.isScanning = true;
  }

  stopScanning() {
    this.isScanning = false;
  }

  get connectedSignals() {
    return this.signals.filter(signal => signal.connected);
  }

  get hamRadioSignals() {
    return this.signals.filter(signal => signal.type === 'ham');
  }

  get bluetoothSignals() {
    return this.signals.filter(signal => signal.type === 'bluetooth');
  }
}
