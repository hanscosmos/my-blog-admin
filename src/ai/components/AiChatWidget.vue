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

    <div class="flex items-center flex-col hover-text" @click="togglePanel">
      <AppIcon name="robot" :size="16"></AppIcon>
      <span class="text-xs mt-1">AI助手</span>
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

<style lang="scss" scoped></style>
