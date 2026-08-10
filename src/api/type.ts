export type ResLoginType = {
  userInfo: {
    id: string;
    nickName: string;
    avatar: string;
    bgCover: string | null;
    sex: string;
    createTime: string;
    loginTime: string;
  };
  token: string;
  csrfToken: string;
};
