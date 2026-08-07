<template>
  <div class="article-category wh-full">
    <MySearchPanel
      :data-exist="categoryList.length > 0"
      :loading="loading"
      hide-bottom
    >
      <template #header>
        <div class="flex">
          <my-button @click="openDialog('add')"
            ><MyIcon name="add" class="mr-2"></MyIcon>新增分类</my-button
          >
        </div>
      </template>
      <div class="p-4">
        <el-table
          :data="categoryList"
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

          <el-table-column
            label="操作"
            fixed="right"
            width="250"
            align="center"
          >
            <template #default="{ row }">
              <div flex w-full class="justify-center">
                <el-button
                  v-if="!row.father"
                  link
                  type="primary"
                  @click="openDialog('add', row)"
                >
                  新增子分类
                </el-button>
                <el-button link type="primary" @click="openDialog('edit', row)">
                  编辑
                </el-button>
                <el-button link type="danger" plain> 删除 </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </MySearchPanel>
  </div>
  <div v-if="formDialogProps.visible">
    <CategoryDialog
      :visible="formDialogProps.visible"
      :opt-type="formDialogProps.optType"
      :row="formDialogProps.row"
      @change-success="getCategoryTree"
      @close="closeDialog"
    ></CategoryDialog>
  </div>
</template>
<script lang="ts" setup>
import { ArticleCategoryItemType } from '@/api/article/category/type';
import CategoryDialog from './components/CategoryDialog.vue';
import { columnList } from './service';
import { useDialog } from '@/hooks/useDialog';
import { useArticleCategory } from '../../hooks/useArticle';

const { formDialogProps, openDialog, closeDialog } =
  useDialog<ArticleCategoryItemType>();

const { categoryList, getCategoryTree, loading } = useArticleCategory();

onBeforeMount(() => {
  getCategoryTree();
});
</script>
<style lang="scss" scoped></style>
