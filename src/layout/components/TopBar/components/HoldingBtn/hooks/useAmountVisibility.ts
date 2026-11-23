import { useLocalStorage } from '@vueuse/core';

/** 按金额整数部分的位数生成占位文本：123456.78 → ****** */
export const createAmountMask = (value: number) => {
  const digits = String(Math.trunc(Math.abs(value))).length;
  return '*'.repeat(Math.max(digits, 1));
};

/** 从已格式化的金额文本中提取整数部分位数并生成占位文本 */
const maskFormattedAmount = (text: string) => {
  const integerPart = text.split('.')[0].replace(/\D/g, '');
  return '*'.repeat(Math.max(integerPart.length, 1));
};

const STORAGE_KEY = 'holding-amount-hidden';

/** 模块级单例：头部按钮与各明细区块共享同一状态，并持久化到本地 */
const amountHidden = useLocalStorage(STORAGE_KEY, false);

export function useAmountVisibility() {
  const toggleAmountHidden = () => {
    amountHidden.value = !amountHidden.value;
  };

  /** 隐藏状态下把已格式化的金额替换为等位数占位文本 */
  const maskAmount = (text: string) =>
    amountHidden.value ? maskFormattedAmount(text) : text;

  return {
    amountHidden,
    toggleAmountHidden,
    maskAmount,
  };
}
