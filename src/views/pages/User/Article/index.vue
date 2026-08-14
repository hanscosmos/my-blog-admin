<template>
  <div class="my-article wh-full">
    <div class="flex items-center justify-between px-4 pt-2 pb-2 border-bottom ">
      <el-segmented v-model="currentLayout" :options="options">
        <template #default="{ item }">
          <div class="xy-center">
            <AppIcon :name="(item as any).icon" size="16"> </AppIcon>
            <span class="ml-2">{{ (item as any).label }}</span>
          </div>
        </template>
      </el-segmented>
      <app-button @click="gotoCreateArticle">
        <AppIcon name="add" class="mr-1"></AppIcon>
        创建文章
      </app-button>

    </div>
    <AppSearchPanel :data-exist="articleList.length > 0" :loading="loading">
      <template #header>
        <div class="w-full flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-2 flex-shrink-0">
              <app-tag size="large">文章标题</app-tag>
              <el-input v-model="searchParams.title" placeholder="请输入关键词搜索" class="!w-200px" clearable
                @change="filterDataListHandler"></el-input>
            </span>
            <span class="flex items-center gap-2">
              <app-tag size="large">发布时间</app-tag>
              <el-date-picker v-model="publishDateRange" type="daterange" class="!w-300px"
                value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" clearable
                @change="changePublishDate"></el-date-picker>
            </span>
            <el-popover ref="moreFilterPopoverRef" placement="bottom-end" :width="360" trigger="click">
              <template #reference>
                <el-button>
                  <AppIcon name="filter" class="mr-1"></AppIcon>
                  更多筛选
                  <AppIcon name="arrow-down" class="ml-1"></AppIcon>
                </el-button>
              </template>
              <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between gap-2">
                  <span class="flex-shrink-0 text-sm">文章类别</span>
                  <el-tree-select v-model="searchParams.category" :data="categoryList" node-key="id" clearable
                    check-strictly filterable :props="{ label: 'name' }" class="!w-220px"
                    placeholder="请选择"></el-tree-select>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="flex-shrink-0 text-sm">文章状态</span>
                  <el-select v-model="searchParams.status" placeholder="请选择" class="!w-220px" clearable>
                    <el-option label="正文" value="publish"></el-option>
                    <el-option label="草稿" value="draft"></el-option>
                  </el-select>
                </div>
                <div class="flex justify-end gap-2 pt-1">
                  <el-button @click="resetMoreFilter">重置</el-button>
                  <el-button type="primary" @click="searchMoreFilter">搜索</el-button>
                </div>
              </div>
            </el-popover>
          </div>

        </div>
      </template>

      <div class="p-4">
        <el-table v-if="currentLayout === 'table'" :data="articleList" style="width: 100%" row-key="id" size="large"
          border stripe :default-sort="{ prop: 'createTime', order: 'descending' }" @sort-change="sortChangeHandler">
          <el-table-column prop="title" label="文章标题" min-width="200" show-overflow-tooltip></el-table-column>
          <el-table-column label="文章封面" width="90" align="center">
            <template #default="{ row }">
              <img v-if="row.cover" :src="row.cover" class="w-50px h-40px object-cover" />
            </template>
          </el-table-column>
          <el-table-column label="类别" width="160" align="center">
            <template #default="{ row }">{{ row.category || '—' }}</template>
          </el-table-column>
          <el-table-column label="文章状态" width="100" align="center">
            <template #default="{ row }">
              <AppTag :name="row.status === 'draft' ? '草稿' : '正文'" :color="row.status === 'draft' ? 'gray' : ''">
              </AppTag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="发布时间" width="160" align="center" sortable="custom">
            <template #default="{ row }">{{ row.createTime }}</template>
          </el-table-column>
          <el-table-column label="最近更新时间" width="160" align="center">
            <template #default="{ row }">{{ row.updateTime }}</template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="200" align="center">
            <template #default="{ row }">
              <div class="flex justify-center">
                <el-button v-if="row.status === 'publish'" link type="primary" @click="gotoArticleDetail(row.id)">
                  查看详情
                </el-button>
                <el-button link type="primary" @click="gotoUpdateArticle(row.id)">编辑</el-button>
                <el-button link type="danger" @click="deleteArticleHandler(row.id)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div v-else-if="currentLayout === 'list'" class="flex flex-col">
          <div class="article-item-wrapper border-bottom" v-for="item in articleList" :key="item.id">
            <ArticleListItem :article="item" @delete="deleteArticleHandler" @edit="gotoUpdateArticle"
              @view="gotoArticleDetail"></ArticleListItem>
          </div>
        </div>

        <ul v-else class="article-list-wrapper">
          <li class="article-item-wrapper" v-for="item in articleList" :key="item.id">
            <ArticleCard :article="item" @delete="deleteArticleHandler" @edit="gotoUpdateArticle"
              @view="gotoArticleDetail">
            </ArticleCard>
          </li>
        </ul>
      </div>

      <template #footer>
        <AppPagination :total="total" :page-number="pageConfig.pageNumber" :page-size="pageConfig.pageSize"
          @page-change="pageChangeHandler"></AppPagination>
      </template>
    </AppSearchPanel>
  </div>
</template>
<script lang="ts" setup>
import { deleteArticleApi } from '@/api/article';
import type { ArticleListItemType } from '@/api/article/type';
import { getUserArticleListApi } from '@/api/user';
import { useSearch } from '@/hooks/useSearch';
import { useArticleCategory } from '@/views/pages/Article/hooks/useArticle';
import ArticleCard from '@/views/pages/Article/pages/ArticleList/components/ArticleCard.vue';
import ArticleListItem from './components/ArticleListItem.vue';

const router = useRouter();
const currentLayout = ref('list');
const options = [
  {
    label: '表格',
    value: 'table',
    icon: 'table',
  },
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

const { categoryList, getCategoryTree } = useArticleCategory();

type UserArticleSearchType = {
  title: string;
  category?: string;
  status: string;
  startTime: string;
  endTime: string;
  sortOrder?: string;
};

const originalParams: UserArticleSearchType = {
  title: '',
  category: '',
  status: '',
  startTime: '',
  endTime: '',
};

const publishDateRange = ref<string | string[]>('');

const {
  searchParams,
  dataList,
  loading,
  total,
  pageConfig,
  pageChangeHandler,
  filterDataListHandler,
  initDataListHandler,
  getDataListHandler,
} = useSearch<UserArticleSearchType, ArticleListItemType>(
  originalParams,
  getUserArticleListApi
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

const moreFilterPopoverRef = ref();

const searchMoreFilter = async () => {
  await filterDataListHandler();
  moreFilterPopoverRef.value?.hide();
};

const resetMoreFilter = async () => {
  searchParams.value.category = '';
  searchParams.value.status = '';
  await filterDataListHandler();
  moreFilterPopoverRef.value?.hide();
};

const changePublishDate = async () => {
  if (publishDateRange.value instanceof Array) {
    searchParams.value.startTime = publishDateRange.value[0];
    searchParams.value.endTime = publishDateRange.value[1];
  } else {
    searchParams.value.startTime = '';
    searchParams.value.endTime = '';
  }
  await filterDataListHandler();
};

const sortChangeHandler = ({ order }: { order: 'ascending' | 'descending' | null }) => {
  searchParams.value.sortOrder = order || 'descending';
  pageConfig.pageNumber = 1;
  getDataListHandler();
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

const gotoCreateArticle = () => {
  router.push({
    name: 'ReleaseArticle',
  });
};

onMounted(() => {
  getCategoryTree();
  initDataListHandler();
});

// 向个人中心上报文章总数
const updateTabCount = inject<(key: string, count: number) => void>('updateTabCount', () => { });
watch(total, (val) => {
  updateTabCount('article', val);
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
