<template>
  <div class="top-bar w-full h-full px-22px flex items-center justify-between">
    <div class="flex items-center">

    </div>
    <div class="flex items-center">
      <TodoListBtn class="!mr-6"></TodoListBtn>
      <MessageBtn class="mx-6"></MessageBtn>
      <ArticleBtn class="mr-6"></ArticleBtn>
      <UserInfo></UserInfo>
      <AiChatWidget class="ml-6" />

    </div>
  </div>
</template>
<script lang="ts" setup>
import ArticleBtn from './components/ArticleBtn/index.vue';
import UserInfo from './components/UserInfo/index.vue';
import TodoListBtn from './components/TodoListBtn/index.vue';
import MessageBtn from './components/MessageBtn/index.vue';
import AiChatWidget from '@/ai/components/AiChatWidget.vue';
</script>
<style lang="scss" scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--sys-text-color);
  background-color: var(--sys-box-bg-color);
}
</style>
