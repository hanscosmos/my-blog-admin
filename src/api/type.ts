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
  refreshToken: string;
  csrfToken: string;
};

export type ResRefreshTokenType = {
  token: string;
};
