import { makeAutoObservable } from 'mobx';

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

  constructor() {
    makeAutoObservable(this);
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
}
