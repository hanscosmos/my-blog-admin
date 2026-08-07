import type { FormDialogProps } from '@/types/type';
import type { UnwrapRef } from 'vue';

export const useDialog = <T>() => {
  const formDialogProps = reactive<FormDialogProps<T | null>>({
    visible: false,
    optType: '',
    row: null,
  });
  const openDialog = (optType: string, row?: UnwrapRef<T> | null) => {
    formDialogProps.visible = true;
    formDialogProps.optType = optType;
    row ? (formDialogProps.row = row) : (formDialogProps.row = null);
  };
  const closeDialog = () => {
    formDialogProps.visible = false;
  };
  return { formDialogProps, openDialog, closeDialog };
};
