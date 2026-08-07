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
