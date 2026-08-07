<template>
  <div class="wh-full p-4 flex">
    <section
      class="dict-category-wrapper wrapper-item w-96 h-full flex flex-col"
    >
      <h3 class="py-2 px-4 flex items-center justify-between">
        <span class="font-title text-lg">系统模块</span>
        <el-button link type="primary" @click="openDialog('add')">
          <MyIcon name="plus" class="mr-1"></MyIcon>新增字典</el-button
        >
      </h3>
      <el-collapse v-model="currentCategory" class="overflow-auto flex-1 h-0">
        <el-collapse-item
          v-for="(item, index) in categoryList"
          :key="index"
          :title="item.label"
          :name="item.code"
        >
          <template #title>
            <span class="text-sm ml-4 font-beauty"
              >{{ item.label }}（{{ item.code }}）</span
            >
          </template>
          <ul class="px-4">
            <li
              v-for="subItem in item.children"
              :key="subItem.code"
              class="py-2 px-4 hover-item hover-common-wrapper"
              :class="{ 'weak-active-item': subItem.code === currentDict }"
              @click.stop="setActiveDict(subItem, item.label)"
            >
              <div class="flex flex-col">
                <span>{{ subItem.label }}</span>
                <span class="text-gray-500">{{ subItem.code }}</span>
              </div>
            </li>
          </ul>
        </el-collapse-item>
      </el-collapse>
    </section>
    <section
      class="dict-item-wrapper wrapper-item flex-1 w-0 h-full ml-4 flex flex-col"
    >
      <h3 class="py-2 px-4 border-bottom flex items-center justify-between">
        <span class="font-title text-lg">
          {{ currentCategoryName }} / {{ currentDictObj?.label }}
        </span>
      </h3>
      <div class="p-4 flex-1 h-0">
        <el-table :data="dictList" size="large" height="100%" stripe border>
          <el-table-column
            v-for="item in columnList"
            :key="item.prop"
            :prop="item.prop"
            :label="item.title"
            align="center"
          ></el-table-column>
          <el-table-column label="状态" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                class="ml-2"
                inline-prompt
                active-text="启用"
                inactive-text="禁用"
                @change="setDictItemStatus(row)"
              />
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            fixed="right"
            width="200"
            align="center"
          >
            <template #default="{ row }">
              <div flex w-full class="justify-center">
                <el-button link type="primary" @click="openDialog('edit', row)">
                  修改
                </el-button>
                <el-button link type="danger" @click="deleteDictHandler(row)">
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
    <div v-if="formDialogProps.visible">
      <DictDialog
        :visible="formDialogProps.visible"
        :opt-type="formDialogProps.optType"
        :row="formDialogProps.row"
        :current-code="currentDict"
        @close="closeDialog"
        @change-success="getDictList"
      ></DictDialog>
    </div>
  </div>
</template>
<script lang="ts" setup>
import {
  changeDictStatusApi,
  deleteDictApi,
  getDictListApi,
} from '@/api/system/dict';
import { DictItemType } from '@/api/system/dict/type';
import { DictCategoryItemType, dictCategoryList } from '@/config/dict';
import { useDialog } from '@/hooks/useDialog';
import { columnList } from './service';
import DictDialog from './components/DictDialog.vue';

const { formDialogProps, openDialog, closeDialog } = useDialog<DictItemType>();

const dictList = ref<DictItemType[]>([]);
const currentCategory = ref('');
const currentCategoryName = ref('');
const currentDictObj = ref<DictCategoryItemType | null>(null);
const currentDict = ref('');
const categoryList = computed(() => {
  return dictCategoryList.filter(
    (item: DictCategoryItemType) => item.children && item.children?.length > 0
  );
});

const setActiveCategory = async (item: DictCategoryItemType) => {
  currentCategory.value = item.code;
  if (item.children && item.children.length > 0) {
    await setActiveDict(item.children[0], item.label);
  }
};

const setActiveDict = async (
  item: DictCategoryItemType,
  parentName: string
) => {
  currentDictObj.value = item;
  currentDict.value = item.code || '';
  currentCategoryName.value = parentName;
  await getDictList();
};

const setDictItemStatus = async (row: DictItemType) => {
  const { data } = await changeDictStatusApi({
    id: row.id,
    status: row.status,
  });
  if (data) {
    ElMessage.success('操作成功');
  }
};
const initPageStatus = () => {
  setActiveCategory(categoryList.value[0]);
};

const getDictList = async () => {
  if (!currentDict.value) return;
  const { data } = await getDictListApi({ code: currentDict.value });
  dictList.value = data;
};

const deleteDictHandler = (row: DictItemType) => {
  confirmHandler('您将永久删除该字典', async () => {
    const { data, msg } = await deleteDictApi({ ids: [row.id] });
    if (data) {
      ElMessage.success(msg);
      await getDictList();
    }
  });
};

onMounted(() => {
  initPageStatus();
});
</script>
<style lang="scss" scoped></style>
