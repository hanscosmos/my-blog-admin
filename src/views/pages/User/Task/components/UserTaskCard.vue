<template>
  <el-card class="task-card p-4 relative" :class="{ 'is-selected': selected }" shadow="hover">

    <div class="task-header">
      <div class="task-header-left">
        <el-checkbox v-if="selectable" :model-value="selected" class="!mr-2" @change="emits('select')" />
        <div class="task-title truncate" :title="task.title">
          {{ task.title }}
        </div>
      </div>

      <!-- 更多操作按钮（悬浮显示下拉菜单） -->
      <el-dropdown trigger="hover" @command="handleCommand">
        <span class="task-more hover-wrapper">
          <el-icon>
            <More />
          </el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="edit">编辑</el-dropdown-item>
            <el-dropdown-item command="delete">删除</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="task-content">
      <div v-if="task.status !== 'done'" class="flex items-center gap-4 mb-2 text-xs">
        <span class="flex items-center">
          <AppIcon name="calendar" class="mr-2"></AppIcon>{{ fmtTime(task.deadline, 'YYYY/MM/DD') }}
        </span>
        <span v-if="priorityList" class="flex items-center" :style="{ color: priorityColorMap[task.priority] }">
          <AppIcon name="level" class="mr-2"></AppIcon>{{ getDictLabelByKey(priorityList, task.priority) }}
        </span>
      </div>
      <div v-else class="flex items-center gap-4 mb-2 text-xs">
        <span v-if="task.startTime && task.endTime" class="flex items-center">
          <AppIcon name="calendar" class="mr-2"></AppIcon>{{ fmtTime(task.startTime, 'MM-DD HH:mm') }}&nbsp;至&nbsp;{{
            fmtTime(task.endTime, 'MM-DD HH:mm')
          }}
        </span>
      </div>
      <p class="line-clamp-2 text-sm h-40px mb-4">{{ task.description }}</p>
      <div class="task-meta text-xs flex items-center justify-between">
        <span v-if="statusList"><app-tag :color="statusColorMap[task.status]"
            :name="getDictLabelByKey(statusList, task.status)" round></app-tag></span>

        <span class="font-beauty text-lg" :class="task.score > 0 ? 'text-red-500' : 'text-green-500'">
          {{ Math.round(task.score * 10) / 10 }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { DictSimpleItemType } from '@/api/system/dict/type';
import { deleteUserTaskApi } from '@/api/user/task';
import { UserTaskItemType } from '@/api/user/task/type';
import { More } from '@element-plus/icons-vue';
import emitter from '@/utils/eventBus';

const props = withDefaults(
  defineProps<{
    task: UserTaskItemType;
    selectable?: boolean;
    selected?: boolean;
  }>(),
  {
    selectable: false,
    selected: false,
  }
);

const emits = defineEmits<{
  (e: 'delete'): void;
  (e: 'select'): void;
}>();

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

const handleCommand = (command: string) => {
  if (command === 'edit') {
    emitter.emit('task:update', props.task);
  } else if (command === 'delete') {
    deleteUserTaskHandler();
  }
};

const deleteUserTaskHandler = async () => {
  confirmHandler('您将删除这个任务', async () => {
    const { data } = await deleteUserTaskApi({
      ids: [props.task.id],
    });
    if (data) {
      ElMessage.success('删除成功');
      emits('delete');
    }
  });
};
</script>

<style scoped>
.task-card {
  position: relative;
  transition: all 0.3s;

  &.is-selected {
    outline: 2px solid var(--theme-color);
  }
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.task-header-left {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.task-title {
  font-weight: 600;
  font-size: 16px;
  min-width: 0;
  flex: 1;
}

.task-more {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 50%;
}

.task-content {
  margin-top: 10px;
}
</style>
