<template>
  <el-popover placement="bottom-end" :width="320" trigger="click" popper-class="todo-popover">
    <template #reference>
      <div class="hover-text flex flex-col items-center cursor-pointer">
        <el-badge :value="badgeCount" :hidden="badgeCount === 0" :max="99">
          <AppIcon name="list" :size="16"></AppIcon>
        </el-badge>
        <span class="text-xs mt-1">待办事项</span>
      </div>
    </template>
    <div class="todo-panel">
      <div class="todo-panel-header">待办事项提醒</div>
      <div v-if="upcomingTasks.length === 0" class="todo-empty">暂无临近到期的待办事项</div>
      <ul v-else class="todo-list">
        <li v-for="task in upcomingTasks" :key="task.id" class="todo-item" @click="goTaskPage">
          <span class="todo-title truncate" :title="task.title">{{ task.title }}</span>
          <span class="todo-time" :class="{ overdue: isOverdue(task) }">
            {{ isOverdue(task) ? '已逾期 ' : '' }}{{ fmtTime(task.deadline, 'MM-DD HH:mm') }}
          </span>
        </li>
      </ul>
    </div>
  </el-popover>
</template>
<script lang="ts" setup>
import { useTaskReminder } from '@/hooks/useTaskReminder';

const router = useRouter();
const { badgeCount, upcomingTasks, isOverdue, start, stop } = useTaskReminder();

const goTaskPage = () => {
  router.push('/user-profile?tab=task');
};

onMounted(start);
onUnmounted(stop);
</script>
<style lang="scss">
.todo-popover {
  .todo-panel-header {
    font-size: 13px;
    font-weight: 600;
    color: var(--sys-text-color);
    padding-bottom: 8px;
    border-bottom: 1px solid var(--sys-border-color);
    margin-bottom: 8px;
  }

  .todo-empty {
    padding: 16px 0;
    text-align: center;
    font-size: 12px;
    color: var(--sys-text-secondary-color);
  }

  .todo-list {
    max-height: 320px;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .todo-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(128, 128, 128, 0.15);
    }

    .todo-title {
      flex: 1;
      min-width: 0;
      font-size: 13px;
      color: var(--sys-text-color);
    }

    .todo-time {
      flex-shrink: 0;
      font-size: 12px;
      color: var(--sys-text-secondary-color);

      &.overdue {
        color: #f56c6c;
      }
    }
  }
}
</style>
