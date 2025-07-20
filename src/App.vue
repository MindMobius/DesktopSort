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
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>DesktopSort</h1>
      <p>面向懒人的Windows应用启动器</p>
      
      <div class="controls">
        <button @click="scanDesktop" :disabled="loading">扫描桌面</button>
        <button @click="classifyApps" :disabled="loading || apps.length === 0">AI分类</button>
        <button @click="resetConfig" :disabled="loading">重置配置</button>
      </div>
      
      <p v-if="message" class="message">{{ message }}</p>
      <div v-if="classifyingStatus" class="status-indicator">
        <div class="spinner"></div>
        <p>AI正在思考中，请稍候...</p>
      </div>
    </header>
    
    <main class="app-content">
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
  background-color: #f0f2f5;
  color: #333;
}
</style>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #4285f4;
}

.app-header p {
  color: #666;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

button {
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #3367d6;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.message {
  color: #4285f4;
  margin-top: 10px;
  font-weight: bold;
}

.app-content {
  min-height: 500px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 18px;
  color: #666;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 18px;
  color: #666;
  text-align: center;
}

.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 20px;
  padding: 20px 0;
}
</style>

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
  border-top-color: #4285f4;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
