<template>
  <div class="user-task flex flex-col wh-full">
    <div
      class="header-wrapper flex items-center justify-between px-4 pb-4 border-bottom"
    >
      <span class="font-bold">个人动态</span>
    </div>
    <div class="content-wrapper flex-1 h-0 overflow-auto">
      <MyInfiniteList
        :loading="loading"
        :items="dataList"
        :finished="dataList.length === total"
        @load-more="loadMoreHandler"
      >
        <template #item="{ item }">
          <div
            class="activity-item flex items-center justify-between p-4 text-gray-500"
          >
            <span
              >于{{ dateDiff(item.createTime) }}前
              <span class="active-text">{{ item.action }}</span>
            </span>
          </div>
        </template>
      </MyInfiniteList>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { getUserActivityApi } from '@/api/user';
import { useSearch } from '@/hooks/useSearch';
import { IActivityItem } from '@/types/user';

const {
  pageConfig,
  loading,
  dataList,
  getDataListHandler,
  total,
  initDataListHandler,
} = useSearch<object, IActivityItem>({}, getUserActivityApi, 20, true);

const loadMoreHandler = () => {
  pageConfig.pageNumber += 1;
  getDataListHandler();
};

onMounted(() => {
  initDataListHandler();
});
</script>
<style lang="scss" scoped></style>
