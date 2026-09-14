import type {
  ImageFormType,
  ImageItemType,
} from '@/api/resource/image/type.ts';
import type { CategoryFormType, CategoryItemType } from '@/api/resource/type';
import type { FormDialogProps } from '@/types/type';

export const categoryColumnList = [
  { title: '名称', prop: 'name' },
  { title: '英文名', prop: 'value' },
  { title: '排序', prop: 'sort' },
  { title: '创建时间', prop: 'createTime' },
];

export const originalForm: ImageFormType = {
  name: '',
  url: '',
  sort: 0,
  desc: '',
  category: '',
};

export const formRules = {
  name: [{ required: true, trigger: 'change', message: '请输入图标名称' }],
  url: [{ required: true, trigger: 'change', message: '请上传图标文件' }],
  sort: [{ required: true, trigger: 'change', message: '请输入图标排序' }],
  category: [{ required: true, trigger: 'change', message: '请选择图标类型' }],
};

export type FormDialogPropsType = FormDialogProps<ImageItemType> & {
  categoryList: CategoryItemType[];
};

/** 批量上传时自动生成的图片名最大长度，与后端 BATCH_NAME_MAX 保持一致 */
export const NAME_MAX = 15;

/** 批量上传允许的图片格式，与 AppImageAutoUpload 默认值一致 */
export const ACCEPT = '.jpg,.jpeg,.png,.webp,.svg,.gif';

export type BatchDialogPropsType = {
  visible: boolean;
  categoryList: CategoryItemType[];
};

export type BatchFileType = {
  uid: string;
  /** 最终入库的图片名（文件名去扩展名后截断） */
  name: string;
  /** 上传成功后回填的文件路径 */
  url: string;
  /** 本地预览地址，需在移除/关闭时手动释放 */
  previewUrl: string;
  status: 'uploading' | 'success' | 'error';
};

/** 预览中展示的状态，重复名是前端预判、并非上传结果 */
export type FileStatusType = BatchFileType['status'] | 'duplicate';

export const categoryOriginalForm: CategoryFormType = {
  name: '',
  sort: 0,
  value: '',
};

export const categoryFormRules = {
  name: [{ required: true, trigger: 'change', message: '请输入名称' }],
  value: [{ required: true, trigger: 'change', message: '请输入英文名' }],
  sort: [{ required: true, trigger: 'change', message: '请输入排序' }],
};

export type CategoryDialogPropsType = FormDialogProps<CategoryItemType>;
