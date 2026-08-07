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
};

export type UserTaskSearchType = {
  status: string;
  priority: string;
  startTime: string;
  endTime: string;
};

export type UserTaskItemType = UserTaskFormType &
  IdType & {
    createTime: string;
    updateTime: string;
    score: number;
  };
