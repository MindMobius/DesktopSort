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
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: var(--shadow);
  transition: all 0.3s;
}

.tips-toggle:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
}

.tips-panel {
  position: absolute;
  bottom: 40px;
  right: 0;
  width: 300px;
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 15px;
  backdrop-filter: blur(10px);
}

.tips-panel h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: var(--primary-color);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: 8px;
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
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.tips-panel li:last-child {
  border-bottom: none;
}

.key {
  background-color: #f1f1f1;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.description {
  color: var(--text-light);
}
</style>