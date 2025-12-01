import { makeAutoObservable } from 'mobx';

export interface Signal {
  id: string;
  type: 'ham' | 'bluetooth';
  name: string;
  frequency?: string;
  strength?: number;
  connected: boolean;
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
      id: Date.now().toString(),
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
