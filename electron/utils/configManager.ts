import Store from 'electron-store';

interface AppInfo {
  name: string;
  path: string;
  iconPath?: string;
  openCount: number;
  category?: string;
}

interface StoreSchema {
  apps: AppInfo[];
  categories: Record<string, string[]>;
  lastScanTime: string;
  shortcuts: Record<string, string>;
}

export class ConfigManager {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      defaults: {
        apps: [],
        categories: {},
        lastScanTime: '',
        shortcuts: {}
      }
    });
  }

  /**
   * 保存应用信息
   */
  saveApps(apps: AppInfo[]): void {
    this.store.set('apps', apps);
    this.store.set('lastScanTime', new Date().toISOString());
  }

  /**
   * 获取应用信息
   */
  getApps(): AppInfo[] {
    return this.store.get('apps');
  }

  /**
   * 保存分类信息
   */
  saveCategories(categories: Record<string, string[]>): void {
    this.store.set('categories', categories);
  }

  /**
   * 获取分类信息
   */
  getCategories(): Record<string, string[]> {
    return this.store.get('categories');
  }

  /**
   * 更新应用打开次数
   */
  incrementAppOpenCount(appPath: string): void {
    const apps = this.getApps();
    const appIndex = apps.findIndex(app => app.path === appPath);
    
    if (appIndex !== -1) {
      apps[appIndex].openCount += 1;
      this.saveApps(apps);
    }
  }

  /**
   * 保存快捷键信息
   */
  saveShortcuts(shortcuts: Record<string, string>): void {
    this.store.set('shortcuts', shortcuts);
  }

  /**
   * 获取快捷键信息
   */
  getShortcuts(): Record<string, string> {
    return this.store.get('shortcuts');
  }

  /**
   * 重置所有配置
   */
  resetConfig(): void {
    this.store.clear();
  }
}