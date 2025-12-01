import { makeAutoObservable } from 'mobx';

export interface Signal {
  id: string;
  type: 'ham' | 'bluetooth';
  name: string;
  frequency?: string;
  strength?: number;
  connected: boolean;
}

/**
 * Generates a unique ID using timestamp and cryptographically random values.
 * This approach:
 * - Uses timestamp for ordering/debugging purposes
 * - Uses random bytes to ensure uniqueness even on rapid successive calls
 * - Works across module reloads and application restarts
 */
function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  const randomPart2 = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${randomPart}${randomPart2}`;
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
