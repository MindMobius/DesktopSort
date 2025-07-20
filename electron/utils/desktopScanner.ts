import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface AppInfo {
  name: string;
  path: string;
  iconPath: string; // 改为必须有值
  openCount: number;
  category?: string;
}

export class DesktopScanner {
  private desktopPath: string;

  constructor() {
    // 获取Windows桌面路径
    this.desktopPath = path.join(os.homedir(), 'Desktop');
  }

  /**
   * 扫描桌面上的应用程序快捷方式
   */
  async scanDesktop(): Promise<AppInfo[]> {
    try {
      const files = fs.readdirSync(this.desktopPath);
      const appInfos: AppInfo[] = [];

      for (const file of files) {
        const filePath = path.join(this.desktopPath, file);
        const stats = fs.statSync(filePath);

        // 只处理文件（快捷方式、可执行文件等）
        if (stats.isFile()) {
          const ext = path.extname(file).toLowerCase();
          // 处理.lnk (快捷方式) 和 .exe 文件
          if (ext === '.lnk' || ext === '.exe') {
            const appName = path.basename(file, ext);
            
            // 根据文件扩展名提供默认图标
            let defaultIcon = '';
            if (ext === '.exe') {
              defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzQyODVmNCIgZD0iTTIxIDJINWMtMS4xIDAtMiAuOS0yIDJ2MTRjMCAxLjEuOSAyIDIgMmgxNmMxLjEgMCAyLS45IDItMlY0YzAtMS4xLS45LTItMi0yem0tMiAxM2gtNnY1aDZWMTV6bTAtN2gtNnY1aDZWOHptLTggN0g1djVoNnYtNXptMC03SDV2NWg2Vjh6Ii8+PC9zdmc+';
            } else {
              defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmYTAwMCIgZD0iTTE5IDNINWMtMS4xIDAtMiAuOS0yIDJ2MTRjMCAxLjEuOSAyIDIgMmgxNGMxLjEgMCAyLS45IDItMlY1YzAtMS4xLS45LTItMi0yem0tOS41IDEzLjVoLTJ2LTdoMnY3em0wLThoLTJ2LTJoMnYyem01LjUgOGgtMnYtNGgydjR6bTAtNWgtMnYtMmgydjJ6bTAgMGgtMnYtMmgydjJ6Ii8+PC9zdmc+';
            }
            
            appInfos.push({
              name: appName,
              path: filePath,
              iconPath: defaultIcon, // 使用默认图标
              openCount: 0, // 初始打开次数为0
            });
          }
        }
      }

      return appInfos;
    } catch (error) {
      console.error('扫描桌面出错:', error);
      return [];
    }
  }


}