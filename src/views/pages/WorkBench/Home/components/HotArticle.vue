<template>
  <div class="wh-full flex flex-col">
    <div class="font-title text-xl p-4 flex items-center justify-between">
      <span class="flex items-center text-lg">
        <my-icon name="fire" class="mr-2" size="16"></my-icon>
        热门文章
      </span>
    </div>
    <el-scrollbar class="flex-1 h-0 overflow-auto">
      <ul>
        <li
          v-for="(item, index) in articleList"
          :key="index"
          class="px-5 py-4 flex items-center justify-between"
        >
          <div class="flex items-center w-full">
            <div class="xy-center">
              <img
                v-if="item.authorAvatar"
                :src="item.authorAvatar"
                class="w-10 h-10 rounded-full mr-4"
              />
            </div>

            <div class="flex flex-col flex-1 w-0 h-10 justify-between">
              <span class="text-sm font-bold truncate">{{ item.title }}</span>
              <span class="text-xs text-gray-500">
                <span class="mr-3">{{ item.author }}</span>
                <span class="mr-3"> {{ dateDiff(item.createTime) }}前 </span>
                <span>{{ item.category }}</span>
              </span>
            </div>
            <div class="font-bold text-sm">
              <div
                class="wrapper-solid-item p-6px hover-wrapper"
                @click="gotoArticleDetail(item.id)"
              >
                <my-icon name="right"></my-icon>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </el-scrollbar>
  </div>
</template>
<script lang="ts" setup>
import { getArticleHotListApi } from '@/api/article';
import { ArticleListItemType } from '@/api/article/type';

const router = useRouter();
const articleList = ref<ArticleListItemType[]>([]);
const getArticleHotList = async () => {
  const { data } = await getArticleHotListApi();
  articleList.value = data.map((item: any) => {
    const articleItem: ArticleListItemType = {
      id: item.id,
      title: item.title,
      abstract: item.abstract,
      cover: item.cover,
      author: item.author.name,
      authorAvatar: item.author.avatar,
      status: item.status,

      category: item.category
        ? item.category.father + '·' + item.category.name
        : '',
      createTime: fmtTime(item.createTime, 'YYYY-MM-DD'),
      updateTime: fmtTime(item.updateTime),
    };
    return articleItem;
  });
};

const gotoArticleDetail = (id: string) => {
  router.push({
    name: 'ArticleDetail',
    query: {
      id,
    },
  });
};

onMounted(() => {
  getArticleHotList();
});
</script>
<style scoped lang="scss"></style>
