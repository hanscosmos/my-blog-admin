<template>
  <div class="flex gap-6 items-start p-6">
    <div
      v-for="panelItem in statusList"
      :key="panelItem.key"
      class="task-panel flex-1 w-0 p-6 pb-2 rounded-2xl"
      :style="{ background: statusBgMap[panelItem.key] }"
    >
      <div class="task-panel-header flex items-center justify-between mb-4">
        <div class="task-panel-title font-title">
          {{ panelItem.value }}
          {{ taskList.filter((item) => item.status === panelItem.key).length }}
        </div>
      </div>
      <ul class="task-panel-list">
        <li
          v-for="item in taskList.filter(
            (item) => item.status === panelItem.key
          )"
          :key="item.id"
          class="mb-4"
        >
          <UserTaskCard :task="item" @delete="getUserTaskList"></UserTaskCard>
        </li>
      </ul>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { DictSimpleItemType } from '@/api/system/dict/type';
import { getUserTaskPanelListApi } from '@/api/user/task';
import { UserTaskItemType } from '@/api/user/task/type';
import dayjs from 'dayjs';
import UserTaskCard from '../components/UserTaskCard.vue';
import emitter from '@/utils/eventBus';

const statusList = inject<Ref<DictSimpleItemType[]>>('statusList');

const statusBgMap: any = {
  todo: 'rgba(138, 138, 138, .1)',
  pending: 'rgba(19, 109, 220, .1)',
  done: 'rgba(19, 220, 109, .1)',
  aborted: 'rgba(220, 19, 19, .1)',
};

const taskList = ref<UserTaskItemType[]>([]);

async function getUserTaskList() {
  const { data } = await getUserTaskPanelListApi({
    startTime: fmtTime(dayjs().subtract(2, 'day').valueOf()),
    endTime: fmtTime(dayjs().add(2, 'day').valueOf()),
  });
  taskList.value = data.map((item: UserTaskItemType) => {
    const taskItem: UserTaskItemType = {
      ...item,
      createTime: fmtTime(item.createTime, 'YYYY-MM-DD'),
      updateTime: fmtTime(item.updateTime),
    };
    return taskItem;
  });
}

onMounted(() => {
  getUserTaskList();
  emitter.on('task:refresh', getUserTaskList);
});

onBeforeUnmount(() => {
  emitter.off('task:refresh');
});
</script>
<style lang="scss" scoped></style>
