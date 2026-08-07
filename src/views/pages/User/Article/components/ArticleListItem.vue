<template>
  <div class="article-item overflow-hidden relative flex p-4 h-36">
    <img
      :src="article.cover || ArticleCover"
      :alt="article.title"
      class="h-full w-40 object-cover"
    />
    <div class="px-4 relative">
      <h2
        class="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center hover-text"
        @click="emits('view', article.id)"
      >
        <MyTag
          :name="article.status === 'draft' ? '草稿' : '正文'"
          :color="article.status === 'draft' ? 'gray' : ''"
        >
        </MyTag>
        <span class="ml-2 truncate" :title="article.title">{{
          article.title
        }}</span>
      </h2>
      <p
        v-if="article.abstract"
        class="mb-2 text-sm leading-5 line-clamp-2 h-10 text-gray-500"
      >
        {{ article.abstract }}
      </p>
      <p v-else class="mb-2 h-10 text-sm text-gray-500">暂无摘要</p>
      <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
        <span class="mr-4">{{ article.author }}</span>
        <span class="mr-4">{{ article.category }}</span>
        <span>{{ article.createTime }}</span>
      </div>
    </div>

    <div class="option-btn flex items-center absolute top-4 right-4">
      <el-button
        v-if="isAuthor"
        link
        type="primary"
        @click="emits('edit', article.id)"
      >
        编辑
      </el-button>

      <el-divider v-if="isAuthor" direction="vertical"></el-divider>
      <el-button
        v-if="isAuthor"
        link
        type="danger"
        @click="emits('delete', article.id)"
      >
        删除
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArticleListItemType } from '@/api/article/type';
import ArticleDraftImg from '@/assets/image/draft.jpg';
import ArticleImg from '@/assets/image/cover.webp';
import { useUserInfoStore } from '@/store/user';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  article: ArticleListItemType;
}>();
const emits = defineEmits<{
  (e: 'view', id: string): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
}>();
const { userId } = storeToRefs(useUserInfoStore());

const ArticleCover = computed(() => {
  return props.article.status === 'publish' ? ArticleImg : ArticleDraftImg;
});

const isAuthor = computed(() => {
  return props.article.authorId === userId.value;
});
</script>
<style lang="scss" scoped>
.option-btn {
  display: none;
}
.article-item {
  &:hover {
    .option-btn {
      display: flex;
    }
  }
}
</style>
