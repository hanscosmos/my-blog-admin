import type { MarketPhysicalCategoryOptionType } from '@/api/market/type';

/** 预设类别，key 与后端 PRESET_CATEGORIES 保持一致 */
export const PHYSICAL_PRESET_CATEGORIES = [
  { key: 'house', name: '房产' },
  { key: 'vehicle', name: '车辆' },
  { key: 'precious_metal', name: '贵金属' },
  { key: 'collectible', name: '收藏品' },
  { key: 'other', name: '其他' },
];

export const PHYSICAL_CATEGORY_COLORS: Record<string, string> = {
  house: '#8b5cf6',
  vehicle: '#0ea5e9',
  precious_metal: '#eab308',
  collectible: '#f97316',
  other: '#9ca3af',
};

/** 自定义类别按选项顺序取色，保持同一类别颜色稳定 */
const CUSTOM_CATEGORY_COLORS = [
  '#14b8a6',
  '#ef4444',
  '#10b981',
  '#6366f1',
  '#f43f5e',
  '#84cc16',
  '#d946ef',
  '#06b6d4',
];

export const physicalCategoryColor = (
  key: string,
  options: MarketPhysicalCategoryOptionType[] = []
) => {
  if (PHYSICAL_CATEGORY_COLORS[key]) return PHYSICAL_CATEGORY_COLORS[key];
  const customKeys = options
    .filter((item) => !item.preset)
    .map((item) => item.key);
  const index = customKeys.indexOf(key);
  return index >= 0
    ? CUSTOM_CATEGORY_COLORS[index % CUSTOM_CATEGORY_COLORS.length]
    : PHYSICAL_CATEGORY_COLORS.other;
};

export const physicalCategoryName = (
  key: string,
  options: MarketPhysicalCategoryOptionType[] = []
) =>
  options.find((item) => item.key === key)?.name ??
  PHYSICAL_PRESET_CATEGORIES.find((item) => item.key === key)?.name ??
  '其他';
