export type AssetItem = {
  label: string;
  value: string;
};

export type BloggerProfileFormType = {
  introduction: string;
  phone: string;
  wechat: string;
  qq: string;
  github: string;
  weibo: string;
  site: string;
  resumeFileUrl: string;
  resumeFileName: string;
  assets: { items: AssetItem[] };
};

export type BloggerProfileType = BloggerProfileFormType & {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};
