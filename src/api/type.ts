export type ResLoginType = {
  userInfo: {
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
