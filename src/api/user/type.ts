export type UserFormType = {
  nickName: string;
  avatar: string | null;
  email: string;
  talks: string;
  bgCover: string;
  sex: number;
  birthday?: string;
};

export type UserInfoType = {
  id?: string;
  nickName: string;
  avatar: string | null;
  email: string;
  talks: string;
  bgCover: string;
  sex: number;
  createTime: string;
  level: number;
  birthday?: string;
};

export type UserStatsType = {
  articleCount: number;
  activityCount: number;
  taskCount: number;
};
