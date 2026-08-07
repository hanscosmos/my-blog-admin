export type UpdateLogFormType = {
  summary: string;
  version: string;
  plannedReleaseDate: string;
  actualReleaseDate: string;
  details: string;
  releasedType: string;
  status: string;
  isCurrentVersion: boolean;
};

export type UpdateLogItemType = IdType &
  UpdateLogFormType & {
    createTime: string | Date;
    updateTime: string | Date;
  };

export type UpdateLogListQueryType = {
  keyword: string;
};
