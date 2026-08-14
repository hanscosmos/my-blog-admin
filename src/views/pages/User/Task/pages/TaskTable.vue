<template>
  <div class="wh-full">
    <AppSearchPanel :data-exist="taskList.length > 0" :loading="loading">
      <template #header>
        <div class="w-full flex items-center gap-4">
          <span class="flex items-center gap-2 flex-shrink-0">
            <app-tag size="large">任务状态</app-tag>
            <el-select v-model="searchParams.status" placeholder="请选择" class="!w-150px" clearable
              @change="filterUserTaskList">
              <el-option v-for="item in statusList" :key="item.key" :value="item.key" :label="item.value"></el-option>
            </el-select>
          </span>
          <span class="flex items-center gap-2">
            <app-tag size="large">优先级</app-tag>
            <el-select v-model="searchParams.priority" placeholder="请选择" class="!w-150px" clearable
              @change="filterUserTaskList">
              <el-option v-for="item in priorityList" :key="item.key" :value="item.key" :label="item.value"></el-option>
            </el-select>
          </span>
          <span class="flex items-center gap-2">
            <app-tag size="large">截止日期</app-tag>
            <el-date-picker v-model="deadlineDateRange" type="daterange" class="!w-320px"
              value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" clearable
              @change="filterUserTaskList"></el-date-picker>
          </span>
        </div>
      </template>
      <template #footer>
        <AppPagination :total="total" :page-number="pageConfig.pageNumber" :page-size="pageConfig.pageSize"
          @page-change="pageChangeHandler"></AppPagination>
      </template>
      <div class="p-4">
        <el-table :data="taskList" size="large" stripe border :default-sort="{ prop: 'endTime', order: 'descending' }"
          @sort-change="sortChangeHandler">
          <el-table-column prop="title" label="名称" fixed min-width="200" show-overflow-tooltip></el-table-column>
          <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip></el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <app-tag :color="statusColorMap[row.status]" :name="getDictLabelByKey(statusList, row.status)"
                round></app-tag>
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="100" align="center">
            <template #default="{ row }">
              <span :style="{ color: priorityColorMap[row.priority] }">{{ getDictLabelByKey(priorityList, row.priority)
                }}</span>
            </template>
          </el-table-column>
          <el-table-column label="截止时间" width="160" align="center">
            <template #default="{ row }">{{ row.deadline ? fmtTime(row.deadline, 'YYYY-MM-DD HH:mm') : '—' }}</template>
          </el-table-column>
          <el-table-column prop="endTime" label="结束时间" width="160" align="center" sortable="custom">
            <template #default="{ row }">{{ row.endTime ? fmtTime(row.endTime, 'YYYY-MM-DD HH:mm') : '—' }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="120" align="center">
            <template #default="{ row }">{{ fmtTime(row.createTime, 'YYYY-MM-DD') }}</template>
          </el-table-column>
          <el-table-column prop="score" label="得分" width="90" align="center">
            <template #default="{ row }">
              <span class="font-beauty" :class="row.score > 0 ? 'text-red-500' : 'text-green-500'">
                {{ Math.round(row.score * 10) / 10 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="120" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="editHandler(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteHandler(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </AppSearchPanel>
  </div>
</template>
<script lang="ts" setup>
import { deleteUserTaskApi, getUserTaskListApi } from '@/api/user/task';
import { UserTaskItemType, UserTaskSearchType } from '@/api/user/task/type';
import { DictSimpleItemType } from '@/api/system/dict/type';
import { useSearch } from '@/hooks/useSearch';
import emitter from '@/utils/eventBus';

const statusList = inject<Ref<DictSimpleItemType[]>>('statusList');
const priorityList = inject<Ref<DictSimpleItemType[]>>('priorityList');

const statusColorMap: Record<UserTaskItemType['status'], string> = {
  todo: 'gray',
  pending: '#165dff',
  done: 'green',
  aborted: 'red',
};

const priorityColorMap: Record<UserTaskItemType['priority'], string> = {
  low: 'green',
  medium: '#165dff',
  high: 'orange',
  urgency: '#fb5050',
};

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

const sortChangeHandler = ({ order }: { order: 'ascending' | 'descending' | null }) => {
  searchParams.value.sortOrder = order || 'descending';
  pageConfig.pageNumber = 1;
  getDataListHandler();
};

const editHandler = (row: UserTaskItemType) => {
  emitter.emit('task:update', row);
};

const deleteHandler = (row: UserTaskItemType) => {
  confirmHandler('您将删除这个任务', async () => {
    const { data } = await deleteUserTaskApi({ ids: [row.id] });
    if (data) {
      ElMessage.success('删除成功');
      filterUserTaskList();
    }
  });
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
<style lang="scss" scoped></style>
