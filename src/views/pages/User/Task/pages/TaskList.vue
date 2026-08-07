<template>
  <div class="wh-full">
    <MySearchPanel :data-exist="taskList.length > 0" :loading="loading">
      <template #header>
        <div class="w-full flex items-center gap-6">
          <span class="flex items-center gap-3 flex-shrink-0">
            <my-tag size="large">任务状态</my-tag>
            <el-select
              v-model="searchParams.status"
              placeholder="请选择"
              class="!w-150px"
              clearable
              @change="filterUserTaskList"
            >
              <el-option
                v-for="item in statusList"
                :key="item.key"
                :value="item.key"
                :label="item.value"
              ></el-option>
            </el-select>
          </span>
          <span class="flex items-center gap-3">
            <my-tag size="large">任务优先级</my-tag>
            <el-select
              v-model="searchParams.priority"
              placeholder="请选择"
              class="!w-150px"
              clearable
              @change="filterUserTaskList"
            >
              <el-option
                v-for="item in priorityList"
                :key="item.key"
                :value="item.key"
                :label="item.value"
              ></el-option>
            </el-select>
          </span>
          <span class="flex items-center gap-3">
            <my-tag size="large">截止日期</my-tag>
            <el-date-picker
              v-model="deadlineDateRange"
              type="daterange"
              class="!w-320px"
              value-format="YYYY-MM-DD HH:mm:ss"
              range-separator="至"
              clearable
              @change="filterUserTaskList"
            ></el-date-picker>
          </span>
        </div>
      </template>
      <template #footer>
        <MyPagination
          :total="total"
          :page-number="pageConfig.pageNumber"
          :page-size="pageConfig.pageSize"
          @page-change="pageChangeHandler"
        ></MyPagination>
      </template>
      <ul class="list-content-wrapper p-4">
        <li v-for="item in taskList" :key="item.id">
          <UserTaskCard
            :task="item"
            @edit="emits('edit', item)"
            @delete="filterUserTaskList"
          />
        </li>
      </ul>
    </MySearchPanel>
  </div>
</template>
<script lang="ts" setup>
import { getUserTaskListApi } from '@/api/user/task';
import { UserTaskItemType, UserTaskSearchType } from '@/api/user/task/type';
import { useSearch } from '@/hooks/useSearch';
import UserTaskCard from '../components/UserTaskCard.vue';
import { DictSimpleItemType } from '@/api/system/dict/type';
import emitter from '@/utils/eventBus';

const emits = defineEmits<{
  (e: 'edit', task: UserTaskItemType): void;
}>();

const statusList = inject<Ref<DictSimpleItemType[]>>('statusList');
const priorityList = inject<Ref<DictSimpleItemType[]>>('priorityList');

const deadlineDateRange = ref<string | string[]>('');
const originalParams: UserTaskSearchType = {
  status: '',
  priority: '',
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

defineExpose({
  filterUserTaskList,
});
onMounted(() => {
  initDataListHandler();
  emitter.on('task:refresh', filterUserTaskList);
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
