export type UserTaskFormType = {
  title: string;
  tags: string[];
  description: string;
  priority: string;
  status: string;
  deadline: string;
  startTime?: string | null;
  endTime?: string | null;
  importance: number;
  urgency: number;
  growth: number;
  happiness: number;
  negative: number;
  remindBeforeMinutes: number;
};

export type UserTaskSearchType = {
  keyword: string;
  status: string;
  priority: string;
  tag: string;
  startTime: string;
  endTime: string;
  sortOrder?: string;
};

export type UserTaskTagItemType = {
  name: string;
  count: number;
};

export type UserTaskItemType = UserTaskFormType &
  IdType & {
    createTime: string;
    updateTime: string;
    score: number;
  };
