<template>
  <div class="top-bar w-full h-full px-22px flex items-center justify-between">
    <div class="flex items-center">

    </div>
    <div class="flex items-center">
      <TodoListBtn class="mr-6"></TodoListBtn>
      <TrendBtn class="mr-6"></TrendBtn>
      <MessageBtn class="mr-6"></MessageBtn>
      <UserInfo></UserInfo>
      <ArticleBtn class="ml-6"></ArticleBtn>
    </div>
  </div>
</template>
<script lang="ts" setup>
import ArticleBtn from './components/ArticleBtn/index.vue';
import UserInfo from './components/UserInfo/index.vue';
import TodoListBtn from './components/TodoListBtn/index.vue';
import TrendBtn from './components/TrendBtn/index.vue';
import MessageBtn from './components/MessageBtn/index.vue';


</script>
<style lang="scss" scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--sys-text-color);
  background-color: var(--sys-bg-color);
}
</style>
