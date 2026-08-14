<template>
  <div class="ai-chat-widget">
    <!-- 聊天面板（ElDrawer 从右侧滑出） -->
    <el-drawer v-model="isOpen" direction="rtl" :size="900" :show-close="false" :close-on-click-modal="true"
      :destroy-on-close="false" title="">
      <template #header>
        <!-- 空的 header，我们自己画 -->
        <span>AI助手</span>
      </template>
      <AiChatPanel />
    </el-drawer>

    <div title="ai助手" class="trigger-btn wrapper-solid-item rounded-lg p-2" :class="{ 'is-open': isOpen }"
      @click="togglePanel">
      <AppIcon name="robot" :size="14" color="#fff" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAiChatStore } from '@/ai/store/aiChat'
import { storeToRefs } from 'pinia'
import AiChatPanel from '@/ai/components/AiChatPanel.vue'

const store = useAiChatStore()
const { isOpen } = storeToRefs(store)
const { togglePanel } = store

// 全局键盘快捷键: Ctrl/Cmd + K 切换面板
function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    togglePanel()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.trigger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  }

  &:active {
    transform: scale(0.95);
  }

  &.is-open {
    background: var(--sys-text-secondary-color);
    transform: rotate(90deg);
  }
}
</style>
