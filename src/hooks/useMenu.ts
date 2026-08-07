import { getNavMenuTreeApi } from '@/api/authority/menu';
import { useMenuStore } from '@/store/menu';
import { storeToRefs } from 'pinia';

export const useMenu = () => {
  const { menuTreeList } = storeToRefs(useMenuStore());
  const getNavMenuTreeList = async () => {
    const { data } = await getNavMenuTreeApi();
    menuTreeList.value = data;
  };
  return { getNavMenuTreeList };
};
