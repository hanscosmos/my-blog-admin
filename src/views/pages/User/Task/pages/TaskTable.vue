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
      <div class="p-4">
        <el-table ref="tableRef" :data="taskList" size="large" stripe border row-key="id"
          :default-sort="{ prop: 'endTime', order: 'descending' }" @sort-change="sortChangeHandler"
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" fixed reserve-selection></el-table-column>
          <el-table-column prop="title" label="名称" fixed min-width="200" show-overflow-tooltip></el-table-column>
          <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip></el-table-column>
          <el-table-column label="标签" min-width="160" align="center">
            <template #default="{ row }">
              <div v-if="row.tags && row.tags.length" class="flex items-center gap-1 flex-wrap justify-center">
                <span v-for="tag in row.tags" :key="tag" class="cursor-pointer" @click="selectTag(tag)">
                  <app-tag :name="tag" :color="getTagColor(tag)" round size="small"></app-tag>
                </span>
              </div>
              <span v-else>—</span>
            </template>
          </el-table-column>
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
          <el-table-column label="操作" fixed="right" width="160" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="editHandler(row)">编辑</el-button>
              <el-button link type="primary" @click="copyHandler(row)">复制</el-button>
              <el-button link type="danger" @click="deleteHandler(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </AppSearchPanel>
  </div>
</template>
<script lang="ts" setup>
import { deleteUserTaskApi, getUserTaskListApi, getUserTaskTagListApi } from '@/api/user/task';
import { UserTaskItemType, UserTaskSearchType, UserTaskTagItemType } from '@/api/user/task/type';
import { DictSimpleItemType } from '@/api/system/dict/type';
import { useSearch } from '@/hooks/useSearch';
import UserTaskTagCloud from '../components/UserTaskTagCloud.vue';
import emitter from '@/utils/eventBus';
import { useTaskBatchSelect } from '../hooks/useTaskBatchSelect';
import type { TableInstance } from 'element-plus';

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

const tableRef = ref<TableInstance>();

const { selectedIds, setSelectedIds, batchDelete } = useTaskBatchSelect(() => {
  tableRef.value?.clearSelection();
  filterUserTaskList();
  getTagList();
});

const handleSelectionChange = (rows: UserTaskItemType[]) => {
  setSelectedIds(rows.map((row) => row.id));
};

const sortChangeHandler = ({ order }: { order: 'ascending' | 'descending' | null }) => {
  searchParams.value.sortOrder = order || 'descending';
  pageConfig.pageNumber = 1;
  getDataListHandler();
};

const editHandler = (row: UserTaskItemType) => {
  emitter.emit('task:update', row);
};

const copyHandler = (row: UserTaskItemType) => {
  emitter.emit('task:copy', row);
};

const deleteHandler = (row: UserTaskItemType) => {
  confirmHandler('您将删除这个任务', async () => {
    const { data } = await deleteUserTaskApi({ ids: [row.id] });
    if (data) {
      ElMessage.success('删除成功');
      filterUserTaskList();
      getTagList();
      emitter.emit('user:stats-refresh');
    }
  });
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
<style lang="scss" scoped></style>
