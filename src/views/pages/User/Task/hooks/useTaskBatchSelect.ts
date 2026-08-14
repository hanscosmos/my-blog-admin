import { deleteUserTaskApi } from '@/api/user/task';
import { UserTaskItemType } from '@/api/user/task/type';
import { ElMessage } from 'element-plus';
import { confirmHandler } from '@/utils/tool';

/**
 * 事项批量选择与批量删除逻辑。
 * 选择状态以 id 集合维护，翻页后不丢失（表格视图配合 reserve-selection 使用）。
 */
export const useTaskBatchSelect = (refresh: () => void) => {
  const selectedIds = ref<Set<string>>(new Set());

  const isSelected = (id: string) => selectedIds.value.has(id);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds.value);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selectedIds.value = next;
  };

  const setSelectedIds = (ids: string[]) => {
    selectedIds.value = new Set(ids);
  };

  const toggleSelectAll = (rows: UserTaskItemType[]) => {
    const next = new Set(selectedIds.value);
    const allSelected =
      rows.length > 0 && rows.every((row) => next.has(row.id));
    rows.forEach((row) => {
      if (allSelected) {
        next.delete(row.id);
      } else {
        next.add(row.id);
      }
    });
    selectedIds.value = next;
  };

  const clearSelection = () => {
    selectedIds.value = new Set();
  };

  const batchDelete = async () => {
    const ids = [...selectedIds.value];
    if (!ids.length) return;
    confirmHandler(`您将删除选中的 ${ids.length} 个事项`, async () => {
      const { data } = await deleteUserTaskApi({ ids });
      if (data) {
        ElMessage.success('删除成功');
        clearSelection();
        refresh();
      }
    });
  };

  return {
    selectedIds,
    isSelected,
    toggleSelect,
    setSelectedIds,
    toggleSelectAll,
    clearSelection,
    batchDelete,
  };
};
