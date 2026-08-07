import { getAvailableDictListApi } from '@/api/system/dict';
import type { DictSimpleItemType } from '@/api/system/dict/type';

export const useDict = (code: string) => {
  const dictDataList = ref<DictSimpleItemType[]>([]);
  const getDictDataList = async () => {
    const { data } = await getAvailableDictListApi({ code });
    dictDataList.value = data;
  };

  const getValueByKey = (arr: DictSimpleItemType[], key: string) => {
    return arr.find((item) => item.key === key)?.value;
  };
  return { dictDataList, getDictDataList, getValueByKey };
};
