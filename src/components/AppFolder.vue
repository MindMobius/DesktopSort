<script setup lang="ts">
import { ref, computed } from 'vue';
import { AppInfo } from '../types';

const props = defineProps<{
  category: string;
  apps: AppInfo[];
}>();

const isOpen = ref(false);

// 根据打开次数计算图标大小
const getIconSize = (app: AppInfo) => {
  const baseSize = 40; // 基础大小
  const maxSize = 60; // 最大大小
  const factor = Math.min(app.openCount / 10, 1); // 缩放因子，最大为1
  return baseSize + factor * (maxSize - baseSize);
};

// 获取文件夹预览图标（显示前4个应用）
const previewApps = computed(() => {
  return props.apps.slice(0, 4);
});

// 打开应用
const openApp = async (app: AppInfo) => {
  await window.desktopSort.openApp(app.path);
};

// 切换文件夹打开/关闭状态
const toggleFolder = () => {
  isOpen.value = !isOpen.value;
};
</script>

<template>
  <div class="app-folder">
    <!-- 文件夹图标 -->
    <div class="folder-icon" @click="toggleFolder">
      <div class="folder-preview">
        <div v-for="app in previewApps" :key="app.path" class="preview-item">
          <div class="app-icon" v-if="!app.iconPath">{{ app.name.charAt(0) }}</div>
          <img v-else :src="app.iconPath" class="app-icon-img" alt="应用图标" />
        </div>
      </div>
      <div class="folder-name">{{ category }}</div>
    </div>

    <!-- 文件夹内容弹窗 -->
    <div v-if="isOpen" class="folder-content">
      <div class="folder-header">
        <h3>{{ category }}</h3>
        <button @click="toggleFolder" class="close-btn">×</button>
      </div>
      <div class="apps-grid">
        <div v-for="app in apps" :key="app.path" class="app-item" @click="openApp(app)">
          <div class="app-icon" v-if="!app.iconPath" :style="{ width: `${getIconSize(app)}px`, height: `${getIconSize(app)}px` }">
            {{ app.name.charAt(0) }}
          </div>
          <img v-else :src="app.iconPath" class="app-icon-img" :style="{ width: `${getIconSize(app)}px`, height: `${getIconSize(app)}px` }" alt="应用图标" />
          <div class="app-name">{{ app.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-folder {
  position: relative;
}

.folder-icon {
  width: 100px;
  height: 100px;
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: var(--shadow);
}

.folder-icon:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.folder-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 4px;
  width: 70px;
  height: 70px;
}

.preview-item {
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-name {
  margin-top: 8px;
  font-size: 14px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
  font-weight: 500;
}

.folder-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 900px;
  height: 85%;
  max-height: 700px;
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(15px);
}

.folder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.folder-header h3 {
  font-size: 18px;
  color: var(--primary-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-light);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: var(--text-color);
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 20px;
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 10px;
  border-radius: var(--border-radius);
}

.app-item:hover {
  background-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.app-icon {
  width: 50px;
  height: 50px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-name {
  margin-top: 8px;
  font-size: 13px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
  color: var(--text-color);
}

.app-icon-img {
  border-radius: 12px;
  object-fit: contain;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>