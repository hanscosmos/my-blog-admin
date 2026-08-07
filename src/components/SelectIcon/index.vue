<template>
  <div class="flex w-full h-full">
    <div class="w-16 h-16 mr-4">
      <MyImageAutoUpload editable type="icon"></MyImageAutoUpload>
    </div>

    <el-popover
      ref="popoverRef"
      placement="bottom"
      :width="400"
      trigger="click"
      class="select-icon"
    >
      <template #reference>
        <div
          v-if="currentIcon?.url"
          class="w-16 h-16 xy-center hover-text hover-border border-wrapper border-dashed relative"
          title="从图标库中选择"
        >
          <img :src="currentIcon.url" alt="" class="w-1/2 h-1/2" />
          <div class="absolute top-0 right-0 w-4 h-4 xy-center">
            <my-icon
              name="delete"
              size="12"
              title="删除"
              class="cursor-pointer hover:text-red-500"
              @click.stop="clearIcon"
            ></my-icon>
          </div>
        </div>
        <div
          v-else
          class="w-16 h-16 xy-center hover-text hover-border border-wrapper border-dashed"
          title="从图标库中选择"
        >
          <my-icon name="selected" size="24"></my-icon>
        </div>
      </template>
      <div v-loading="loading">
        <div class="flex mb-4">
          <el-input
            v-model="searchParams.name"
            placeholder="请输入名称"
            class="flex-1 w-0 mr-4"
            clearable
            @change="filterDataListHandler"
          >
          </el-input>
          <el-button
            :icon="Search"
            type="primary"
            @click="filterDataListHandler"
          ></el-button>
        </div>
        <ul class="icon-wrapper h-full w-full mb-4">
          <li
            v-for="item in dataList"
            :key="item.id"
            class="h-16"
            :class="{ 'active-item': currentIcon?.id === item.id }"
            @click="selectIcon(item)"
          >
            <IconCardItem :item="item" layout="card"></IconCardItem>
          </li>
        </ul>
        <MyPagination
          :total="total"
          :page-number="pageConfig.pageNumber"
          :page-size="pageConfig.pageSize"
          hide-jump
          hide-size
          @page-change="pageChangeHandler"
        ></MyPagination>
      </div>
    </el-popover>
  </div>
</template>
<script lang="ts" setup>
import { getIconListApi } from '@/api/resource/icon';
import { useSearch } from '@/hooks/useSearch.ts';
import { Search } from '@element-plus/icons-vue';
import { IconItemType, IconSearchType } from '@/api/resource/icon/type';
import IconCardItem from '@/views/pages/Resource/Icon/components/IconCardItem.vue';

const emits = defineEmits(['confirm']);

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
} = useSearch<IconSearchType, IconItemType>(originalParams, getIconListApi);

const popoverRef = ref();
const hidePopover = () => {
  popoverRef.value.hide();
};
const currentIcon = ref<IconItemType | null>(null);
const selectIcon = (item: IconItemType) => {
  currentIcon.value = item;
  hidePopover();
  emits('confirm', item);
};

const clearIcon = () => {
  currentIcon.value = null;
  emits('confirm', null);
};

onBeforeMount(() => {
  initDataListHandler();
});
</script>
<style lang="scss" scoped>
.icon-wrapper {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-content: start;
  gap: 16px;
}
</style>
