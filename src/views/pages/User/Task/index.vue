<template>
  <div class="user-task wh-full flex flex-col">
    <div
      class="header-wrapper px-4 pb-4 border-bottom flex items-center justify-between"
    >
      <el-segmented v-model="pageStatus" :options="tabList" size="default">
        <template #default="{ item }">
          <span>{{ (item as any).label }}</span>
        </template>
      </el-segmented>
      <el-text v-if="pageStatus === 'dashboard'">
        面板默认展示最近三天的已完成任务事项以及所有的待办和进行中的事项。
      </el-text>
      <my-button @click="openDialog('add')">
        <my-icon name="add" class="mr-1"></my-icon>
        新增事项</my-button
      >
    </div>
    <div class="content-wrapper flex-1 h-0 overflow-auto">
      <component :is="currentComponent"></component>
    </div>
  </div>
  <div v-if="formDialogProps.visible">
    <UserTaskFormDialog
      :visible="formDialogProps.visible"
      :opt-type="formDialogProps.optType"
      :row="formDialogProps.row"
      :status-list="statusList"
      :priority-list="priorityList"
      @close="closeDialog"
      @change-success="changeSuccessHandler"
    >
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

const pageStatus = ref<'dashboard' | 'list'>('dashboard');
const tabList = [
  { value: 'dashboard', label: '面板', component: shallowRef(TaskDashboard) },
  { value: 'list', label: '列表', component: shallowRef(TaskList) },
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
