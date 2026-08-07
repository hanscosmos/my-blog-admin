<template>
  <div class="flex flex-col wh-full">
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
          <span>新建图片</span></my-button
        >
      </div>
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
    <div v-loading="loading" class="image-wrapper flex-1 h-0 flex flex-col p-4">
      <ul class="image-list-wrapper flex-1 h-0 overflow-auto">
        <li class="image-item-wrapper" v-for="item in dataList" :key="item.id">
          <ImageCardItem
            :item="item"
            @edit="(item) => openDialog('edit', item)"
          ></ImageCardItem>
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
      <ImageFormDialog
        :visible="formDialogProps.visible"
        :opt-type="formDialogProps.optType"
        :row="formDialogProps.row"
        :category-list="formDialogProps.categoryList"
        @close="closeDialog"
        @change-success="filterDataListHandler"
      ></ImageFormDialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getImageCategoryListApi,
  getImageListApi,
} from '@/api/resource/image/index.ts';
import ImageFormDialog from '../../components/ImageFormDialog.vue';
import { type FormDialogPropsType, originalForm } from '../../service.ts';
import { ImageItemType, ImageSearchType } from '@/api/resource/image/type.ts';
import ImageCardItem from '../../components/ImageCardItem.vue';
import { CategoryItemType } from '@/api/resource/type.ts';
import { useSearch } from '@/hooks/useSearch.ts';
const categoryList = ref<CategoryItemType[]>([]);
const originalParams: ImageSearchType = { name: '', category: '' };

const {
  searchParams,
  dataList,
  loading,
  total,
  pageConfig,
  pageChangeHandler,
  filterDataListHandler,
  initDataListHandler,
} = useSearch<ImageSearchType, ImageItemType>(originalParams, getImageListApi);

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
  const { data } = await getImageCategoryListApi();
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
.image-list-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  align-content: start;
  gap: 1rem;
  .image-item-wrapper {
    height: 240px;
  }
}
</style>
