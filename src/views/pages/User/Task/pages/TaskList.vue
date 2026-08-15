<template>
  <div class="wh-full">
    <AppSearchPanel :data-exist="taskList.length > 0" :loading="loading">
      <template #header>
        <div class="w-full">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-4 flex-wrap">
            <span class="flex items-center gap-2 flex-shrink-0">
              <app-tag size="large">关键字</app-tag>
              <el-input v-model="searchParams.keyword" placeholder="请输入关键词搜索" class="!w-200px" clearable
                @change="filterUserTaskList"></el-input>
            </span>
            <span class="flex items-center gap-2">
              <app-tag size="large">任务状态</app-tag>
              <el-select v-model="searchParams.status" placeholder="请选择" class="!w-150px" clearable
                @change="filterUserTaskList">
                <el-option v-for="item in statusList" :key="item.key" :value="item.key" :label="item.value"></el-option>
              </el-select>
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
                  <span class="flex-shrink-0 text-sm">优先级</span>
                  <el-select v-model="searchParams.priority" placeholder="请选择" class="!w-220px" clearable>
                    <el-option v-for="item in priorityList" :key="item.key" :value="item.key"
                      :label="item.value"></el-option>
                  </el-select>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="flex-shrink-0 text-sm">截止日期</span>
                  <el-date-picker v-model="deadlineDateRange" type="daterange" class="!w-220px"
                    value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" clearable></el-date-picker>
                </div>
                <div class="flex justify-end gap-2 pt-1">
                  <el-button @click="resetMoreFilter">重置</el-button>
                  <el-button type="primary" @click="searchMoreFilter">搜索</el-button>
                </div>
              </div>
            </el-popover>
          </div>
          <div class="flex items-center gap-3 flex-shrink-0">
            <el-checkbox :model-value="isAllSelected" :indeterminate="selectedIds.size > 0 && !isAllSelected"
              @change="toggleSelectAllHandler">全选本页</el-checkbox>
            <el-button type="danger" plain :disabled="!selectedIds.size" @click="batchDelete">
              批量删除{{ selectedIds.size ? `（${selectedIds.size}）` : '' }}
            </el-button>
              <span v-if="selectedIds.size" class="text-sm text-gray-400">已选 {{ selectedIds.size }} 项</span>
            </div>
          </div>
          <div class="mt-2">
            <UserTaskTagCloud :tag-list="tagList" :active-tag="searchParams.tag" @select="selectTag" />
          </div>
        </div>
      </template>
      <template #footer>
        <AppPagination :total="total" :page-number="pageConfig.pageNumber" :page-size="pageConfig.pageSize"
          @page-change="pageChangeHandler"></AppPagination>
      </template>
      <ul class="list-content-wrapper p-4">
        <li v-for="item in taskList" :key="item.id">
          <UserTaskCard :task="item" selectable :selected="isSelected(item.id)" tag-clickable
            @select="toggleSelect(item.id)" @filter-tag="selectTag" @edit="emits('edit', item)"
            @delete="filterUserTaskList" />
        </li>
      </ul>
    </AppSearchPanel>
  </div>
</template>
<script lang="ts" setup>
import { getUserTaskListApi, getUserTaskTagListApi } from '@/api/user/task';
import { UserTaskItemType, UserTaskSearchType, UserTaskTagItemType } from '@/api/user/task/type';
import { useSearch } from '@/hooks/useSearch';
import UserTaskCard from '../components/UserTaskCard.vue';
import UserTaskTagCloud from '../components/UserTaskTagCloud.vue';
import { DictSimpleItemType } from '@/api/system/dict/type';
import emitter from '@/utils/eventBus';
import { useTaskBatchSelect } from '../hooks/useTaskBatchSelect';

const emits = defineEmits<{
  (e: 'edit', task: UserTaskItemType): void;
}>();

const statusList = inject<Ref<DictSimpleItemType[]>>('statusList');
const priorityList = inject<Ref<DictSimpleItemType[]>>('priorityList');

const deadlineDateRange = ref<string | string[]>('');
const originalParams: UserTaskSearchType = {
  keyword: '',
  status: '',
  priority: '',
  tag: '',
  startTime: '',
  endTime: '',
};
const {
  searchParams,
  dataList,
  loading,
  total,
  pageConfig,
  getDataListHandler,
  pageChangeHandler,
  initDataListHandler,
} = useSearch<UserTaskSearchType, UserTaskItemType>(
  originalParams,
  getUserTaskListApi
);

const taskList = computed(() => {
  return dataList.value.map((item: UserTaskItemType) => {
    const taskItem: UserTaskItemType = {
      ...item,
      createTime: fmtTime(item.createTime, 'YYYY-MM-DD'),
      updateTime: fmtTime(item.updateTime),
    };
    return taskItem;
  });
});

const filterUserTaskList = async () => {
  if (deadlineDateRange.value instanceof Array) {
    searchParams.value.startTime = deadlineDateRange.value[0];
    searchParams.value.endTime = deadlineDateRange.value[1];
  } else {
    searchParams.value.startTime = '';
    searchParams.value.endTime = '';
  }
  pageConfig.pageNumber = 1;
  await getDataListHandler();
};

const moreFilterPopoverRef = ref();

const searchMoreFilter = async () => {
  await filterUserTaskList();
  moreFilterPopoverRef.value?.hide();
};

const resetMoreFilter = async () => {
  searchParams.value.priority = '';
  deadlineDateRange.value = '';
  await filterUserTaskList();
  moreFilterPopoverRef.value?.hide();
};

const tagList = ref<UserTaskTagItemType[]>([]);

const getTagList = async () => {
  const { data } = await getUserTaskTagListApi();
  tagList.value = data;
};

const selectTag = (tag: string) => {
  // 再次点击当前已选标签则取消筛选
  searchParams.value.tag = tag === searchParams.value.tag ? '' : tag;
  filterUserTaskList();
};

const {
  selectedIds,
  isSelected,
  toggleSelect,
  toggleSelectAll,
  batchDelete,
} = useTaskBatchSelect(() => {
  filterUserTaskList();
  getTagList();
});

const isAllSelected = computed(() => {
  return (
    taskList.value.length > 0 &&
    taskList.value.every((item) => selectedIds.value.has(item.id))
  );
});

const toggleSelectAllHandler = () => {
  toggleSelectAll(taskList.value);
};

defineExpose({
  filterUserTaskList,
});
onMounted(() => {
  initDataListHandler();
  getTagList();
  emitter.on('task:refresh', (resetToFirstPage: boolean) => {
    if (resetToFirstPage) {
      filterUserTaskList();
    } else {
      getDataListHandler();
    }
    getTagList();
  });
});

onBeforeUnmount(() => {
  emitter.off('task:refresh');
});
</script>
<style lang="scss" scoped>
.list-content-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
</style>
