export interface FormDialogProps<T> {
  visible: boolean;
  optType: string;
  row: T;
}

export type TabItem = {
  name: string;
  routeName: string;
  id: string;
  icon: string;
  query?: Record<string, string>;
};
