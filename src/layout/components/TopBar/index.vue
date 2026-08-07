<template>
  <div class="top-bar w-full h-full px-22px flex items-center justify-between">
    <div class="flex items-center">
      <div class="xy-center h-16">
        <span class="flex items-center">
          <FoldBtn></FoldBtn>
          <span
            class="font-title text-xl ml-5 flex-shrink-0 relative top-2px hover-text"
            @click="goBackToIndex"
          >
            博客后台管理系统
          </span>
        </span>
      </div>
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
import FoldBtn from './components/FoldBtn/index.vue';
import ArticleBtn from './components/ArticleBtn/index.vue';
import UserInfo from './components/UserInfo/index.vue';
import TodoListBtn from './components/TodoListBtn/index.vue';
import TrendBtn from './components/TrendBtn/index.vue';
import MessageBtn from './components/MessageBtn/index.vue';

const router = useRouter();

const goBackToIndex = () => {
  router.push({ name: 'Home' });
};
</script>
<style lang="scss" scoped>
.top-bar {
  border-bottom: solid 1px var(--sys-border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--sys-text-color);
  background: linear-gradient(90deg, var(--theme-hover), transparent);
  backdrop-filter: blur(10px);
}
</style>
