<template>
  <div class="wh-full">
    <MySearchPanel :data-exist="dataList.length > 0" :loading="loading">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <my-tag size="large" class="mr-4">文章标题</my-tag>
            <el-input
              v-model="searchParams.title"
              class="!w-280px mr-4"
              placeholder="请输入关键词搜索"
              clearable
              @change="filterDataListHandler"
            ></el-input>
            <my-tag size="large" class="mr-4">文章类别</my-tag>
            <el-tree-select
              v-model="searchParams.category"
              :data="categoryList"
              node-key="id"
              clearable
              check-strictly
              filterable
              :props="{ label: 'name' }"
              class="!w-280px"
              @change="changeCategory"
            />
          </div>
          <el-segmented v-model="currentLayout" :options="options">
            <template #default="{ item }">
              <div class="xy-center">
                <my-icon :name="(item as any).icon" size="16"> </my-icon>
              </div>
            </template>
          </el-segmented>
        </div>
      </template>
      <div class="p-4">
        <el-table
          v-if="currentLayout === 'list'"
          :data="articleList"
          style="width: 100%"
          row-key="id"
          size="large"
          border
          stripe
          default-expand-all
        >
          <el-table-column
            v-for="item in columnList"
            :key="item.prop"
            :prop="item.prop"
            :label="item.title"
            align="center"
          ></el-table-column>
          <el-table-column label="文章封面" align="center">
            <template #default="{ row }">
              <img v-if="row.cover" :src="row.cover" class="w-50px h-40px" />
            </template>
          </el-table-column>
          <el-table-column label="作者" align="center">
            <template #default="{ row }">
              <div class="xy-center">
                <img
                  v-if="row.authorAvatar"
                  :src="row.authorAvatar"
                  class="w-8 h-8 rounded-full mr-4"
                />
                <span class="">
                  {{ row.author }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类别" align="center">
            <template #default="{ row }">
              <div>{{ row.category }}</div>
            </template>
          </el-table-column>
          <el-table-column label="文章状态" align="center">
            <template #default="{ row }">
              <MyTag
                :name="row.status === 'draft' ? '草稿' : '正文'"
                :color="row.status === 'draft' ? 'gray' : ''"
              ></MyTag>
            </template>
          </el-table-column>
          <el-table-column label="发布时间" align="center">
            <template #default="{ row }">
              <div>{{ row.createTime }}</div>
            </template>
          </el-table-column>
          <el-table-column label="最近更新时间" align="center">
            <template #default="{ row }">
              <div>{{ row.updateTime }}</div>
            </template>
          </el-table-column>

          <el-table-column
            label="操作"
            fixed="right"
            width="250"
            align="center"
          >
            <template #default="{ row }">
              <div flex w-full class="justify-center">
                <el-button
                  v-if="row.status === 'publish'"
                  link
                  type="primary"
                  @click="gotoArticleDetail(row.id)"
                >
                  查看详情
                </el-button>
                <el-button
                  v-if="isAuthor(row)"
                  link
                  type="primary"
                  @click="gotoUpdateArticle(row.id)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="isAuthor(row)"
                  link
                  type="danger"
                  @click="deleteArticleHandler(row.id)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <ul v-else class="article-list-wrapper">
          <li
            class="article-item-wrapper"
            v-for="item in articleList"
            :key="item.id"
          >
            <ArticleCard
              :article="item"
              @delete="deleteArticleHandler"
              @edit="gotoUpdateArticle"
              @view="gotoArticleDetail"
            ></ArticleCard>
          </li>
        </ul>
      </div>
      <template #footer>
        <MyPagination
          :total="total"
          :page-number="pageConfig.pageNumber"
          :page-size="pageConfig.pageSize"
          @page-change="pageChangeHandler"
        ></MyPagination>
      </template>
    </MySearchPanel>
  </div>
</template>
<script lang="ts" setup>
import { deleteArticleApi, getArticleListApi } from '@/api/article';
import { ArticleListItemType, ArticleQueryType } from '@/api/article/type';
import { useArticleCategory } from '../../hooks/useArticle';
import { useSearch } from '@/hooks/useSearch';
import { columnList } from './service';
import { fmtTime } from '@/utils/tool';
import ArticleCard from './components/ArticleCard.vue';
import { storeToRefs } from 'pinia';
import { useUserInfoStore } from '@/store/user';

const { userId } = storeToRefs(useUserInfoStore());

const router = useRouter();
const { categoryList, getCategoryTree } = useArticleCategory();
const currentLayout = ref('list');
const options = [
  {
    label: '列表',
    value: 'list',
    icon: 'view-grid-list',
  },
  {
    label: '卡片',
    value: 'card',
    icon: 'view-grid-card',
  },
];

const originalParams: ArticleQueryType = { title: '', category: '' };
const isAuthor = (row: ArticleListItemType) => {
  return row.authorId === userId.value;
};
const {
  searchParams,
  dataList,
  loading,
  total,
  pageConfig,
  pageChangeHandler,
  filterDataListHandler,
  initDataListHandler,
} = useSearch<ArticleQueryType, ArticleListItemType>(
  originalParams,
  getArticleListApi
);

const articleList = computed(() => {
  return dataList.value.map((item: any) => {
    const articleItem: ArticleListItemType = {
      id: item.id,
      title: item.title,
      abstract: item.abstract,
      cover: item.cover,
      author: item.author.name,
      authorId: item.author.id,
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
});

const changeCategory = async (category: string) => {
  searchParams.value.category = category;
  await filterDataListHandler();
};

const deleteArticleHandler = (id: string) => {
  confirmHandler('您将和删除这篇文章', async () => {
    const res = await deleteArticleApi(id);
    if (res) {
      ElMessage.success('删除成功');
      await initDataListHandler();
    }
  });
};

const gotoArticleDetail = (id: string) => {
  router.push({
    name: 'ArticleDetail',
    query: { id },
  });
};

const gotoUpdateArticle = (id: string) => {
  router.push({
    name: 'UpdateArticle',
    query: { id },
  });
};

onMounted(() => {
  getCategoryTree();
  initDataListHandler();
});
</script>
<style lang="scss" scoped>
.article-list-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-content: start;
  gap: 1rem;
}
</style>
