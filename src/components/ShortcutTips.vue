<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 常用快捷键列表
const shortcuts = ref([
  { key: 'Ctrl+C', description: '复制' },
  { key: 'Ctrl+V', description: '粘贴' },
  { key: 'Ctrl+Z', description: '撤销' },
  { key: 'Ctrl+Y', description: '重做' },
  { key: 'Ctrl+A', description: '全选' },
  { key: 'Ctrl+S', description: '保存' },
  { key: 'Ctrl+F', description: '查找' },
  { key: 'Alt+Tab', description: '切换窗口' },
  { key: 'Win+D', description: '显示桌面' },
  { key: 'Win+E', description: '打开文件资源管理器' },
]);

// 是否显示快捷键提示
const showTips = ref(false);

// 切换显示/隐藏快捷键提示
const toggleTips = () => {
  showTips.value = !showTips.value;
};
</script>

<template>
  <div class="shortcut-tips">
    <button @click="toggleTips" class="tips-toggle">
      {{ showTips ? '隐藏快捷键' : '显示快捷键' }}
    </button>
    
    <div v-if="showTips" class="tips-panel">
      <h3>常用快捷键</h3>
      <ul>
        <li v-for="(shortcut, index) in shortcuts" :key="index">
          <span class="key">{{ shortcut.key }}</span>
          <span class="description">{{ shortcut.description }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.shortcut-tips {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

.tips-toggle {
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.tips-panel {
  position: absolute;
  bottom: 40px;
  right: 0;
  width: 300px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  padding: 15px;
}

.tips-panel h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: #333;
}

.tips-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-panel li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.tips-panel li:last-child {
  border-bottom: none;
}

.key {
  background-color: #f1f1f1;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
}

.description {
  color: #666;
}
</style>