export type DictCategoryItemType = {
  label: string;
  value: string;
  code: string;
  children?: DictCategoryItemType[];
};

export const dictCategoryList: DictCategoryItemType[] = [
  {
    label: '文章',
    value: 'article',
    code: 'ARTICLE',
    children: [
      {
        label: '文章状态',
        value: 'article_status',
        code: 'ARTICLE_STATUS',
      },
      {
        label: '文章可见性',
        value: 'article_visible',
        code: 'ARTICLE_VISIBLE',
      },
      {
        label: '文章属性',
        value: 'article_property',
        code: 'ARTICLE_PROPERTY',
      },
      {
        label: '标签颜色',
        value: 'article_tag_color',
        code: 'ARTICLE_TAG_COLOR',
      },
    ],
  },
  {
    label: '权限',
    value: 'authority',
    code: 'AUTHORITY',
    children: [
      {
        label: '菜单类型',
        value: 'menu_type',
        code: 'MENU_TYPE',
      },
      {
        label: '菜单颜色',
        value: 'menu_color',
        code: 'MENU_COLOR',
      },
    ],
  },
  {
    label: '系统',
    value: 'system',
    code: 'SYSTEM',
    children: [
      {
        label: '日志状态',
        value: 'update_log_status',
        code: 'UPDATE_LOG_STATUS',
      },
      {
        label: '日志类型',
        value: 'update_log_release_type',
        code: 'UPDATE_LOG_RELEASE_TYPE',
      },
    ],
  },
  {
    label: '用户',
    value: 'user',
    code: 'USER',
    children: [
      {
        label: '任务状态',
        value: 'user_task_status',
        code: 'USER_TASK_STATUS',
      },
      {
        label: '任务优先级',
        value: 'user_task_priority',
        code: 'USER_TASK_PRIORITY',
      },
      {
        label: '用户动态类型',
        value: 'user_activity_type',
        code: 'USER_ACTIVITY_TYPE',
      },
    ],
  },
  {
    label: '其他',
    value: 'other',
    code: 'OTHER',
    children: [
      {
        label: '人员性别',
        value: 'person_gender',
        code: 'PERSON_GENDER',
      },
    ],
  },
];

type DictMapItemType<T> = {
  label: string;
  value: T;
  key: string;
};
export const colorList: DictMapItemType<number[]>[] = [
  { key: 'red', label: '红色', value: [255, 0, 0] },
  { key: 'blue', label: '蓝色', value: [0, 0, 255] },
  { key: 'green', label: '绿色', value: [0, 255, 0] },
  { key: 'purple', label: '紫色', value: [255, 0, 0] },
  { key: 'yellow', label: '黄色', value: [255, 255, 0] },
];

export const getLabelByKey = (arr: DictMapItemType<any>[], key: string) => {
  return arr.find((item) => item.key === key)?.label;
};
