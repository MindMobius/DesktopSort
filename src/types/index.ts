export interface AppInfo {
  name: string;
  path: string;
  iconPath?: string;
  openCount: number;
  category?: string;
}

export interface Category {
  name: string;
  apps: AppInfo[];
}

// 声明全局接口
declare global {
  interface Window {
    desktopSort: {
      scanDesktop: () => Promise<AppInfo[]>;
      classifyApps: () => Promise<{ apps: AppInfo[]; categories: Record<string, string[]> }>;
      getApps: () => Promise<AppInfo[]>;
      getCategories: () => Promise<Record<string, string[]>>;
      openApp: (appPath: string) => Promise<boolean>;
      saveConfig: () => Promise<boolean>;
      resetConfig: () => Promise<boolean>;
      getClassificationStatus: () => Promise<boolean>;
      ipcRenderer: {
        on: (channel: string, callback: Function) => void;
        off: (channel: string, callback: Function) => void;
        send: (channel: string, ...args: any[]) => void;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
      };
    };
  }
}