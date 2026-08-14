<template>
  <div class="user-task wh-full flex flex-col">
    <div class="px-4 pt-2 pb-2 border-bottom flex items-center justify-between">
      <div class="flex items-center gap-2">
        <el-segmented v-model="pageStatus" :options="tabList">
          <template #default="{ item }">
            <span>{{ (item as any).label }}</span>
          </template>
        </el-segmented>
        <el-tooltip v-if="pageStatus === 'dashboard'" content="面板默认展示最近三天的已完成任务事项以及所有的待办和进行中的事项。" placement="bottom">
          <span class="text-gray-400 cursor-pointer text-xs ml-1">?</span>
        </el-tooltip>
      </div>
      <app-button @click="openDialog('add')">
        <AppIcon name="add" class="mr-1"></AppIcon>
        新增事项
      </app-button>
    </div>
    <div class="content-wrapper flex-1 h-0 overflow-auto">
      <component :is="currentComponent"></component>
    </div>
  </div>
  <div v-if="formDialogProps.visible">
    <UserTaskFormDialog :visible="formDialogProps.visible" :opt-type="formDialogProps.optType"
      :row="formDialogProps.row" :status-list="statusList" :priority-list="priorityList" @close="closeDialog"
      @change-success="changeSuccessHandler">
    </UserTaskFormDialog>
  </div>
</template>
<script lang="ts" setup>
import { useDict } from '@/hooks/useDict';
import UserTaskFormDialog from './components/UserTaskFormDialog.vue';
import { UserTaskItemType } from '@/api/user/task/type';
import { useDialog } from '@/hooks/useDialog';
import TaskList from './pages/TaskList.vue';
import TaskDashboard from './pages/TaskDashboard.vue';
import TaskTable from './pages/TaskTable.vue';
import emitter from '@/utils/eventBus';

const { formDialogProps, openDialog, closeDialog } =
  useDialog<UserTaskItemType>();
const { dictDataList: statusList, getDictDataList: getStatusList } =
  useDict('USER_TASK_STATUS');
const { dictDataList: priorityList, getDictDataList: getPriorityList } =
  useDict('USER_TASK_PRIORITY');

provide('statusList', statusList);
provide('priorityList', priorityList);

const changeSuccessHandler = () => {
  emitter.emit('task:refresh', true);
  closeDialog();
};

const pageStatus = ref<'dashboard' | 'list' | 'table'>('dashboard');
const tabList = [
  { value: 'dashboard', label: '面板', component: shallowRef(TaskDashboard) },
  { value: 'list', label: '列表', component: shallowRef(TaskList) },
  { value: 'table', label: '表格', component: shallowRef(TaskTable) },
];

const currentComponent = computed(() => {
  return tabList.find((item) => item.value === pageStatus.value)?.component
    .value;
});

onMounted(() => {
  getStatusList();
  getPriorityList();
  emitter.on('task:update', (task: UserTaskItemType) => {
    openDialog('edit', task);
  });
});

onUnmounted(() => {
  emitter.off('task:update');
});
</script>
<style lang="scss" scoped></style>
