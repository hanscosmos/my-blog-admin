<template>
  <div class="article-tag wh-full">
    <MySearchPanel :data-exist="dataList.length > 0" :loading="loading">
      <template #header>
        <div class="flex items-center">
          <el-input
            v-model="searchParams.name"
            class="!w-280px mr-4"
            placeholder="请输入关键词搜索"
            clearable
            @change="filterDataListHandler"
          ></el-input>
          <my-button @click="openDialog('add')"
            ><MyIcon name="add" class="mr-2"></MyIcon>新增标签</my-button
          >
        </div>
      </template>
      <div class="p-4">
        <el-table
          :data="dataList"
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
          <el-table-column prop="color" align="center" label="颜色">
            <template #default="{ row }">
              <MyTag
                :name="getValueByKey(colorList, row.color) as string"
                :color="row.color"
              ></MyTag>
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
                <el-button link type="primary" @click="openDialog('edit', row)">
                  编辑
                </el-button>
                <el-button link type="danger" plain> 删除 </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
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
  <div v-if="formDialogProps.visible">
    <TagDialog
      :visible="formDialogProps.visible"
      :opt-type="formDialogProps.optType"
      :row="formDialogProps.row"
      :color-list="colorList"
      @change-success="filterDataListHandler"
      @close="closeDialog"
    ></TagDialog>
  </div>
</template>
<script lang="ts" setup>
import { getArticleTagListApi } from '@/api/article/tag';
import {
  ArticleTagItemType,
  SearchArticleTagType,
} from '@/api/article/tag/type';
import TagDialog from './components/TagDialog.vue';
import { columnList } from './service';
import { useDialog } from '@/hooks/useDialog';
import { useSearch } from '@/hooks/useSearch';
import { useDict } from '@/hooks/useDict';
const {
  dictDataList: colorList,
  getDictDataList: getColorList,
  getValueByKey,
} = useDict('ARTICLE_TAG_COLOR');

const { formDialogProps, openDialog, closeDialog } =
  useDialog<ArticleTagItemType>();

const originalParams = { name: '' };
const {
  searchParams,
  dataList,
  loading,
  total,
  pageConfig,
  filterDataListHandler,
  initDataListHandler,
  pageChangeHandler,
} = useSearch<SearchArticleTagType, ArticleTagItemType>(
  originalParams,
  getArticleTagListApi
);

onMounted(async () => {
  await getColorList();
  await initDataListHandler();
});
</script>
<style lang="scss" scoped></style>
