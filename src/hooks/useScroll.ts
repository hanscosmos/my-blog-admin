import { useElementSize } from '@vueuse/core';

export const useScroll = (scrollLength: number) => {
  const scrollRef = ref();
  const parentRef = ref();
  const { width: scrollRefWidth } = useElementSize(scrollRef);
  const { width: parentRefWidth } = useElementSize(parentRef);
  const isScroll = () => {
    const { scrollWidth, clientWidth } = scrollRef.value;
    return scrollWidth > clientWidth;
  };

  const isShowBtn = ref(false);
  const clickLeftHandle = () => {
    if (scrollRef.value.scrollLeft > 0) {
      scrollRef.value.scrollLeft -= scrollLength;
    }
  };
  const clickRightHandle = () => {
    isScroll() && (scrollRef.value.scrollLeft += scrollLength);
  };

  const controlFn = () => {
    scrollRef.value && (isShowBtn.value = isScroll());
  };

  watch([scrollRefWidth, parentRefWidth], controlFn);

  return { scrollRef, parentRef, isShowBtn, clickLeftHandle, clickRightHandle };
};
