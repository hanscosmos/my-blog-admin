<template>
  <div class="flex flex-col wh-full" :class="currentLayout">
    <div
      class="header-wrapper border-bottom p-4 flex justify-between items-center"
    >
      <div class="flex items-center">
        <el-input
          v-model="searchParams.name"
          placeholder="输入名称搜索"
          class="mr-4 !w-280px"
          clearable
          @change="filterDataListHandler"
        ></el-input>
        <my-button @click="openDialog('add')">
          <my-icon name="add" class="mr-2"></my-icon>

          <span>新建图标</span></my-button
        >
      </div>

      <el-segmented v-model="currentLayout" :options="options">
        <template #default="{ item }">
          <div class="xy-center">
            <my-icon :name="(item as any).icon" size="16"> </my-icon>
          </div>
        </template>
      </el-segmented>
    </div>
    <div class="category-wrapper border-bottom h-10">
      <ul class="flex items-center h-full px-4">
        <li
          class="hover-wrapper text-xs rounded px-2 py-1 mr-2"
          :class="{ 'active-item': searchParams.category === item.id }"
          v-for="item in categoryList"
          :key="item.id"
          @click="changeCategory(item.id)"
        >
          {{ item.name }}
        </li>
      </ul>
    </div>
    <div v-loading="loading" class="icon-wrapper flex-1 h-0 flex flex-col p-4">
      <ul
        class="icon-list-wrapper flex-1 h-0 overflow-auto flex flex-wrap gap-3"
      >
        <li class="icon-item-wrapper" v-for="item in dataList" :key="item.id">
          <IconCardItem :item="item" :layout="currentLayout"></IconCardItem>
        </li>
      </ul>
      <div class="mt-4">
        <MyPagination
          :total="total"
          :page-number="pageConfig.pageNumber"
          :page-size="pageConfig.pageSize"
          @page-change="pageChangeHandler"
        ></MyPagination>
      </div>
    </div>
    <div v-if="formDialogProps.visible">
      <IconFormDialog
        :visible="formDialogProps.visible"
        :opt-type="formDialogProps.optType"
        :row="formDialogProps.row"
        :category-list="formDialogProps.categoryList"
        @close="closeDialog"
        @change-success="filterDataListHandler"
      ></IconFormDialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getIconCategoryListApi,
  getIconListApi,
} from '@/api/resource/icon/index.ts';
import IconFormDialog from '../../components/IconFormDialog.vue';
import { type FormDialogPropsType, originalForm } from '../../service.ts';
import { IconItemType, IconSearchType } from '@/api/resource/icon/type.ts';
import IconCardItem from '../../components/IconCardItem.vue';
import { CategoryItemType } from '@/api/resource/type.ts';
import { useSearch } from '@/hooks/useSearch.ts';
const currentLayout = ref('card');
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

const categoryList = ref<CategoryItemType[]>([]);
const originalParams: IconSearchType = { name: '', category: '' };

const {
  searchParams,
  dataList,
  loading,
  total,
  pageConfig,
  pageChangeHandler,
  filterDataListHandler,
  initDataListHandler,
} = useSearch<IconSearchType, IconItemType>(originalParams, getIconListApi, 50);

const changeCategory = async (category: string) => {
  searchParams.value.category = category;
  await filterDataListHandler();
};

const formDialogProps = reactive<FormDialogPropsType>({
  visible: false,
  optType: '',
  row: { id: '', createTime: '', ...originalForm },
  categoryList: [],
});

const getCategoryList = async () => {
  const { data } = await getIconCategoryListApi();
  formDialogProps.categoryList = data;
  categoryList.value = [
    {
      id: '',
      name: '全部',
      value: '',
      sort: 0,
      createTime: '',
    },
    ...data,
  ];
};

const openDialog = (optType: string, row?: any) => {
  formDialogProps.visible = true;
  formDialogProps.optType = optType;
  row && (formDialogProps.row = row);
};
const closeDialog = () => {
  formDialogProps.visible = false;
};

const initData = async () => {
  await initDataListHandler();
  await getCategoryList();
};

onBeforeMount(() => {
  initData();
});
</script>
<style scoped lang="scss">
.icon-list-wrapper {
  align-content: start;
}
.list {
  .icon-item-wrapper {
    width: 128px;
    height: 64px;
  }
}
.card {
  .icon-item-wrapper {
    width: 64px;
    height: 64px;
  }
}
</style>
