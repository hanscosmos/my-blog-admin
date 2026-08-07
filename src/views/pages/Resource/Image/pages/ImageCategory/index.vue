<template>
  <div class="p-4 h-full">
    <el-table :data="categoryList" height="100%" size="large" border stripe>
      <el-table-column
        v-for="item in categoryColumnList"
        :key="item.prop"
        :prop="item.prop"
        :label="item.title"
        align="center"
      ></el-table-column>
      <el-table-column fixed="right" width="200" align="center">
        <template #header>
          <div class="xy-center">
            <span>操作</span>
            <MyIcon
              name="plus"
              class="hover-text ml-2"
              @click="openDialog('add')"
            ></MyIcon>
          </div>
        </template>
        <template #default="{ row }">
          <div flex w-full class="justify-center">
            <el-button link type="primary" @click="openDialog('edit', row)">
              修改
            </el-button>
            <el-button link type="danger"> 删除 </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="formDialogProps.visible">
      <ImageCategoryDialog
        :visible="formDialogProps.visible"
        :row="formDialogProps.row"
        :opt-type="formDialogProps.optType"
        @close="closeDialog"
        @change-success="getCategoryList"
      ></ImageCategoryDialog>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { CategoryItemType } from '@/api/resource/type';
import ImageCategoryDialog from '../../components/ImageCategoryDialog.vue';
import {
  categoryColumnList,
  CategoryDialogPropsType,
  categoryOriginalForm,
} from '../../service';
import { getImageCategoryListApi } from '@/api/resource/image';

const categoryList = ref<CategoryItemType[]>([]);
const getCategoryList = async () => {
  const { data } = await getImageCategoryListApi();
  categoryList.value = data;
};

const formDialogProps = reactive<CategoryDialogPropsType>({
  visible: false,
  optType: '',
  row: { id: '', createTime: '', ...categoryOriginalForm },
});

const openDialog = (optType: string, row?: any) => {
  formDialogProps.visible = true;
  formDialogProps.optType = optType;
  row && (formDialogProps.row = row);
};
const closeDialog = () => {
  formDialogProps.visible = false;
};

onBeforeMount(() => {
  getCategoryList();
});
</script>
<style lang="scss" scoped></style>
