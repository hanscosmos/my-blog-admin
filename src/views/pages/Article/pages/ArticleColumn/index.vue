<template>
  <div class="article-column wh-full">
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
            ><MyIcon name="add" class="mr-2"></MyIcon>新增专栏</my-button
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
          <el-table-column label="专栏封面" align="center">
            <template #default="{ row }">
              <img v-if="row.cover" :src="row.cover" class="w-50px h-40px" />
            </template>
          </el-table-column>
          <el-table-column
            v-for="item in columnList"
            :key="item.prop"
            :prop="item.prop"
            :label="item.title"
            align="center"
          ></el-table-column>

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
    <ColumnDialog
      :visible="formDialogProps.visible"
      :opt-type="formDialogProps.optType"
      :row="formDialogProps.row"
      @change-success="filterDataListHandler"
      @close="closeDialog"
    ></ColumnDialog>
  </div>
</template>
<script lang="ts" setup>
import { getArticleColumnListApi } from '@/api/article/column';
import {
  ArticleColumnItemType,
  SearchArticleColumnType,
} from '@/api/article/column/type';
import ColumnDialog from './components/ColumnDialog.vue';
import { columnList } from './service';
import { useDialog } from '@/hooks/useDialog';
import { useSearch } from '@/hooks/useSearch';

const { formDialogProps, openDialog, closeDialog } =
  useDialog<ArticleColumnItemType>();

const originalParams = { name: '' };
const {
  searchParams,
  dataList,
  loading,
  total,
  pageConfig,
  initDataListHandler,
  filterDataListHandler,
  pageChangeHandler,
} = useSearch<SearchArticleColumnType, ArticleColumnItemType>(
  originalParams,
  getArticleColumnListApi
);

onMounted(() => {
  initDataListHandler();
});
</script>
<style lang="scss" scoped></style>
