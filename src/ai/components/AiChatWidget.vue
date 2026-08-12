<template>
  <div class="ai-chat-widget">
    <!-- 聊天面板（ElDrawer 从右侧滑出） -->
    <el-drawer v-model="isOpen" direction="rtl" :size="460" :show-close="false"
      :close-on-click-modal="true" :destroy-on-close="false" title="">
      <template #header>
        <!-- 空的 header，我们自己画 -->
        <span></span>
      </template>
      <AiChatPanel />
    </el-drawer>

    <!-- 浮动触发按钮 -->
    <div class="trigger-btn" :class="{ 'is-open': isOpen }" @click="togglePanel">
      <AppIcon v-if="!isOpen" name="robot" :size="24" color="#fff" />
      <AppIcon v-else name="close" :size="20" color="#fff" />
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
.ai-chat-widget {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 2500;
}

.trigger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--theme-color);
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
