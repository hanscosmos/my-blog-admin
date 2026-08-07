export const useSearch = <T, K>(
  originalParams: T,
  getDataFn: (params: PageType & T) => Promise<ResType<ResPageType<K>>>,
  pageSize = 10,
  isScroll = false
) => {
  const searchParams = ref<T>({
    ...originalParams,
  });
  const storageParams = ref<T>({
    ...originalParams,
  });
  const dataList = ref<K[]>([]);
  const pageConfig = reactive({
    pageNumber: 1,
    pageSize,
  });
  const loading = ref(true);
  const total = ref(0);
  const getDataListHandler = async () => {
    loading.value = true;
    storageParams.value = searchParams.value;
    const {
      data: { total: totalCount, result },
    } = await getDataFn({
      ...pageConfig,
      ...(searchParams.value as T),
    });
    total.value = totalCount;
    if (isScroll) {
      dataList.value = [...dataList.value, ...(result as any[])];
    } else {
      dataList.value = result as any[];
    }
    loading.value = false;
  };
  const pageChangeHandler = async ({ pageNumber, pageSize }: PageType) => {
    pageConfig.pageNumber = pageNumber;
    searchParams.value = storageParams.value;
    pageConfig.pageSize = pageSize;
    getDataListHandler();
  };

  const filterDataListHandler = async () => {
    pageConfig.pageNumber = 1;
    await getDataListHandler();
  };

  const initDataListHandler = async () => {
    searchParams.value = { ...originalParams } as any;
    storageParams.value = { ...originalParams } as any;
    await filterDataListHandler();
  };
  return {
    searchParams,
    dataList,
    pageConfig,
    loading,
    total,
    getDataListHandler,
    pageChangeHandler,
    filterDataListHandler,
    initDataListHandler,
  };
};
