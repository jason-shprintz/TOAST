import { makeAutoObservable } from 'mobx';

export interface NavigationTool {
  id: string;
  name: string;
  icon: string;
  lastUsed?: Date;
}

export class NavigationStore {
  tools: NavigationTool[] = [
    { id: 'map', name: 'Map', icon: 'map-outline' },
    { id: 'compass', name: 'Compass', icon: 'compass-outline' },
  ];

  currentLocation: { latitude: number; longitude: number } | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  updateLocation(latitude: number, longitude: number) {
    this.currentLocation = { latitude, longitude };
  }

  markToolUsed(toolId: string) {
    const tool = this.tools.find((t) => t.id === toolId);
    if (tool) {
      tool.lastUsed = new Date();
    }
  }

  get hasLocation() {
    return this.currentLocation !== null;
  }
}
