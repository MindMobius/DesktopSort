<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import AppFolder from './components/AppFolder.vue';
import ShortcutTips from './components/ShortcutTips.vue';
import { AppInfo, Category } from './types';

// 应用数据
const apps = ref<AppInfo[]>([]);
const categories = ref<Record<string, string[]>>({});
const loading = ref(false);
const message = ref('');
const classifyingStatus = ref(false);

// 计算分类后的应用列表
const categorizedApps = computed(() => {
  const result: Category[] = [];
  
  // 处理已分类的应用
  for (const [categoryName, appNames] of Object.entries(categories.value)) {
    const categoryApps = apps.value.filter(app => appNames.includes(app.name));
    if (categoryApps.length > 0) {
      result.push({
        name: categoryName,
        apps: categoryApps
      });
    }
  }
  
  // 处理未分类的应用
  const uncategorizedApps = apps.value.filter(app => !app.category);
  if (uncategorizedApps.length > 0) {
    result.push({
      name: '未分类',
      apps: uncategorizedApps
    });
  }
  
  return result;
});

// 定期检查分类状态
const checkClassificationStatus = async () => {
  if (loading.value) {
    classifyingStatus.value = await window.desktopSort.getClassificationStatus();
    if (classifyingStatus.value) {
      setTimeout(checkClassificationStatus, 1000); // 每秒检查一次
    }
  }
};

// 扫描桌面应用
const scanDesktop = async () => {
  try {
    loading.value = true;
    message.value = '正在扫描桌面应用...';
    const result = await window.desktopSort.scanDesktop();
    apps.value = result;
    message.value = `扫描完成，发现 ${result.length} 个应用`;
  } catch (error) {
    console.error('扫描桌面出错:', error);
    message.value = '扫描桌面出错';
  } finally {
    loading.value = false;
  }
};

// AI分类应用
const classifyApps = async () => {
  try {
    if (apps.value.length === 0) {
      message.value = '请先扫描桌面应用';
      return;
    }
    
    loading.value = true;
    message.value = '正在使用AI分类应用...';
    checkClassificationStatus(); // 开始检查分类状态
    
    const result = await window.desktopSort.classifyApps();
    apps.value = result.apps;
    categories.value = result.categories;
    message.value = 'AI分类完成，分类结果已保存到项目目录';
  } catch (error) {
    console.error('AI分类出错:', error);
    message.value = 'AI分类出错';
  } finally {
    loading.value = false;
    classifyingStatus.value = false;
  }
};

// 重置配置
const resetConfig = async () => {
  try {
    loading.value = true;
    message.value = '正在重置配置...';
    await window.desktopSort.resetConfig();
    apps.value = [];
    categories.value = {};
    message.value = '配置已重置';
  } catch (error) {
    console.error('重置配置出错:', error);
    message.value = '重置配置出错';
  } finally {
    loading.value = false;
  }
};

// 加载已保存的数据
const loadSavedData = async () => {
  try {
    loading.value = true;
    const savedApps = await window.desktopSort.getApps();
    const savedCategories = await window.desktopSort.getCategories();
    
    if (savedApps.length > 0) {
      apps.value = savedApps;
      categories.value = savedCategories;
      message.value = '已加载保存的数据';
    } else {
      message.value = '没有保存的数据，请扫描桌面';
    }
  } catch (error) {
    console.error('加载数据出错:', error);
    message.value = '加载数据出错';
  } finally {
    loading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadSavedData();
});

// 添加窗口控制功能
const minimizeWindow = () => {
  window.desktopSort.ipcRenderer.send('minimize-window');
};

const maximizeWindow = () => {
  window.desktopSort.ipcRenderer.send('maximize-window');
};

const closeWindow = () => {
  window.desktopSort.ipcRenderer.send('close-window');
};
</script>

<template>
  <div class="app-container">
    <!-- 自定义窗口控制栏 -->
    <div class="window-controls">
      <div class="drag-area"></div>
      <div class="window-buttons">
        <button class="window-button minimize" @click="minimizeWindow">—</button>
        <button class="window-button maximize" @click="maximizeWindow">□</button>
        <button class="window-button close" @click="closeWindow">×</button>
      </div>
    </div>
    
    <div class="app-content">
      <!-- 控制区域 -->
      <div class="controls-area">
        <h1>DesktopSort</h1>
        <p>面向懒人的Windows应用启动器</p>
        
        <div class="controls">
          <button @click="scanDesktop" :disabled="loading" class="action-button">
            <span class="icon">📂</span>
            <span>扫描桌面</span>
          </button>
          <button @click="classifyApps" :disabled="loading || apps.length === 0" class="action-button">
            <span class="icon">🤖</span>
            <span>AI分类</span>
          </button>
          <button @click="resetConfig" :disabled="loading" class="action-button">
            <span class="icon">🔄</span>
            <span>重置配置</span>
          </button>
        </div>
        
        <p v-if="message" class="message">{{ message }}</p>
        <div v-if="classifyingStatus" class="status-indicator">
          <div class="spinner"></div>
          <p>AI正在思考中，请稍候...</p>
        </div>
      </div>
      
      <!-- 主内容区域 -->
      <main class="main-content">
        <div v-if="loading" class="loading">加载中...</div>
        
        <div v-else-if="categorizedApps.length === 0" class="empty-state">
          <p>没有应用数据，请点击"扫描桌面"按钮</p>
        </div>
        
        <div v-else class="folders-grid">
          <AppFolder 
            v-for="category in categorizedApps" 
            :key="category.name"
            :category="category.name"
            :apps="category.apps"
          />
        </div>
      </main>
    </div>
    
    <ShortcutTips />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: transparent;
  color: #333;
  overflow: hidden;
  height: 100vh;
}

:root {
  --primary-color: #4285f4;
  --primary-dark: #3367d6;
  --text-color: #333;
  --text-light: #666;
  --bg-color: rgba(240, 242, 245, 0.9);
  --card-bg: rgba(255, 255, 255, 0.8);
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  --border-radius: 12px;
}
</style>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  background-color: var(--bg-color);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 窗口控制栏 */
.window-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  -webkit-app-region: drag; /* 使整个区域可拖动 */
  background-color: rgba(255, 255, 255, 0.7);
}

.drag-area {
  flex: 1;
  height: 100%;
}

.window-buttons {
  display: flex;
  -webkit-app-region: no-drag; /* 按钮区域不可拖动 */
}

.window-button {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.window-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.window-button.close:hover {
  background-color: #e81123;
  color: white;
}

/* 应用内容区域 */
.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 20px 20px;
  overflow: hidden;
}

.controls-area {
  text-align: center;
  padding: 20px 0;
}

.controls-area h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: var(--primary-color);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.controls-area p {
  color: var(--text-light);
  margin-bottom: 20px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.action-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow);
}

.action-button:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
}

.action-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.icon {
  font-size: 18px;
}

.message {
  color: var(--primary-color);
  margin-top: 10px;
  font-weight: bold;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  border-radius: var(--border-radius);
  background-color: var(--card-bg);
  box-shadow: var(--shadow);
}

.loading, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 18px;
  color: var(--text-light);
  text-align: center;
}

/* 文件夹网格 */
.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
  padding: 20px;
}

/* 状态指示器 */
.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  gap: 10px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(66, 133, 244, 0.3);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
