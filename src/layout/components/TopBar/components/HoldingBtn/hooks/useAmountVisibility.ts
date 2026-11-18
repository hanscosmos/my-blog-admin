import { useLocalStorage } from '@vueuse/core';

/** 金额隐藏时的占位文本 */
export const AMOUNT_MASK = '*****';

const STORAGE_KEY = 'holding-amount-hidden';

/** 模块级单例：头部按钮与各明细区块共享同一状态，并持久化到本地 */
const amountHidden = useLocalStorage(STORAGE_KEY, false);

export function useAmountVisibility() {
  const toggleAmountHidden = () => {
    amountHidden.value = !amountHidden.value;
  };

  /** 隐藏状态下把已格式化的金额替换为占位文本 */
  const maskAmount = (text: string) => (amountHidden.value ? AMOUNT_MASK : text);

  return {
    amountHidden,
    toggleAmountHidden,
    maskAmount,
  };
}
